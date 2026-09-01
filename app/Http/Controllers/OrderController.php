<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Exceptions\InsufficientAllowanceException;
use App\Exceptions\InvalidOrderTotalException;
use App\Support\Allowance;
use App\Support\EmployeeQr;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemAddOn;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Carbon\Carbon;

class OrderController extends Controller
{
    /**
     * Display the POS interface
     */
    public function pos()
    {
        return Inertia::render('pos');
    }
    
    /**
     * Display a listing of all orders
     * With optional date filtering
     */
    public function index(Request $request)
    {
        $query = Order::with(['items.addOns', 'cashier:id,name']);

        // Apply date filters if provided
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        } else {
            $query->whereDate('created_at', '>=', Carbon::now()->startOfDay());
        }
        
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        } else {
            $query->whereDate('created_at', '<=', Carbon::now()->endOfDay());
        }

        // Filter by product name or ID if provided
        if ($request->filled('product')) {
            $productSearch = $request->product;

            $query->whereHas('items', function ($itemQuery) use ($productSearch) {
                $itemQuery->where(function ($subQuery) use ($productSearch) {
                    $subQuery->where('product_id', $productSearch)
                        ->orWhere('product_name', 'like', '%' . $productSearch . '%');
                });
            });
        }

        // Filter by order number (partial match)
        if ($request->filled('order_number')) {
            $query->where('order_number', 'like', '%' . $request->order_number . '%');
        }

        // Get results with pagination
        $orders = $query->latest()->paginate(10)->withQueryString();
            
        return Inertia::render('orders/index', [
            'orders' => [
                'data' => $orders->items(),
                'meta' => [
                    'current_page' => $orders->currentPage(),
                    'last_page' => $orders->lastPage(),
                    'total' => $orders->total(),
                ],
            ],
            'filters' => [
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'product' => $request->product,
                'order_number' => $request->order_number,
            ],
            'products' => Product::orderBy('name')->get(['id', 'name'])
        ]);
    }

    /**
     * Store a newly created order in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'payment_method' => ['required', 'string', Rule::in(PaymentMethod::acceptedValues())],
            'order_type' => 'nullable|string',
            'beeper_number' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required',
            'items.*.product_name' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.variant' => 'nullable|string|in:hot,iced',
            'items.*.customizations' => 'nullable|array',
            'items.*.discount' => 'nullable|numeric|min:0',
            'items.*.add_ons' => 'nullable|array',
            'items.*.add_ons.*.product_id' => 'required',
            'items.*.add_ons.*.product_name' => 'required|string',
            'items.*.add_ons.*.price' => 'required|numeric|min:0',
            'items.*.add_ons.*.variant' => 'nullable|string|in:hot,iced',
            'items.*.add_ons.*.customizations' => 'nullable|array',
            'discount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            // Split payment fields
            'split_cash_amount' => 'nullable|numeric|min:0',
            'split_gcash_amount' => 'nullable|numeric|min:0',
            // Employee allowance
            'employee_qr_token' => 'nullable|string|max:255',
        ]);

        $paymentMethod = PaymentMethod::tryFromLabel($validated['payment_method']);

        // An allowance order is only valid against a live, eligible employee.
        // The token is re-resolved here rather than trusting whatever the
        // scanner screen decided a moment ago.
        $allowanceEmployee = null;

        if ($paymentMethod === PaymentMethod::EmployeeAllowance) {
            if (blank($validated['employee_qr_token'] ?? null)) {
                return back()->withErrors(['payment' => 'Scan the employee QR to use the employee allowance.']);
            }

            $result = EmployeeQr::resolve($validated['employee_qr_token']);

            if (! $result['resolution']->isOk()) {
                return back()->withErrors([
                    'payment' => ($result['message'] ?? 'This QR cannot be used.').' Payment rejected.',
                ]);
            }

            $allowanceEmployee = $result['user'];
        }

        // Additional validation for split payment
        if ($paymentMethod->isSplit()) {
            if (empty($validated['split_cash_amount']) || empty($validated['split_gcash_amount'])) {
                return back()->withErrors(['payment' => 'Both cash and GCash amounts are required for split payment.']);
            }
            
            // Validate that split amounts sum to total (we'll calculate total first)
            $subtotalForValidation = collect($validated['items'])->sum(function ($item) {
                $itemTotal = $item['price'] * $item['quantity'];
                if (!empty($item['add_ons'])) {
                    foreach ($item['add_ons'] as $addOn) {
                        $itemTotal += $addOn['price'] * ($addOn['quantity'] ?? 1);
                    }
                }
                return $itemTotal - ($item['discount'] ?? 0);
            });
            
            $totalForValidation = $subtotalForValidation - ($validated['discount'] ?? 0);
            $splitTotal = $validated['split_cash_amount'] + $validated['split_gcash_amount'];
            
            if (abs($splitTotal - $totalForValidation) > 0.01) { // Allow for small floating point differences
                return back()->withErrors(['payment' => 'Split payment amounts must equal the order total.']);
            }
        }

        try {
            DB::beginTransaction();

            // Calculate totals
            $subtotal = collect($validated['items'])->sum(function ($item) {
                $itemTotal = $item['price'] * $item['quantity'];
                
                // Add add-ons to the item total
                if (!empty($item['add_ons'])) {
                    foreach ($item['add_ons'] as $addOn) {
                        $itemTotal += $addOn['price'] * ($addOn['quantity'] ?? 1);
                    }
                }
                
                return $itemTotal - ($item['discount'] ?? 0);
            });

            $discount = $validated['discount'] ?? 0;
            $total = $subtotal - $discount;

            // Discounts are validated as non-negative but have no upper bound,
            // so a large enough one drives the total below zero. Persisting
            // that would post negative revenue into sales monitoring and pull
            // down the expected cash drawer.
            if ($total < 0) {
                throw new InvalidOrderTotalException('The discount cannot be greater than the order subtotal.');
            }

            // Redeeming nothing is not a redemption. Without this the order is
            // refused further down with a confusing "this order needs 0.00".
            if ($paymentMethod === PaymentMethod::EmployeeAllowance && $total <= 0) {
                throw new InvalidOrderTotalException(
                    'An employee allowance order must total more than zero.',
                    'payment',
                );
            }

            // Create the order
            $order = Order::create([
                'order_number' => 'ORD-' . strtoupper(Str::random(8)),
                'subtotal' => $subtotal,
                'discount' => $discount,
                'total' => $total,
                'payment_method' => $paymentMethod->value,
                'payment_status' => 'completed',
                'status' => 'pending', // Start as pending, will be completed via kitchen queue
                'order_type' => $validated['order_type'] ?? 'dine-in',
                'beeper_number' => $validated['beeper_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'user_id' => auth()->id(),
                'allowance_user_id' => $allowanceEmployee?->id,
                'split_cash_amount' => $paymentMethod->isSplit() ? ($validated['split_cash_amount'] ?? null) : null,
                'split_gcash_amount' => $paymentMethod->isSplit() ? ($validated['split_gcash_amount'] ?? null) : null,
            ]);

            // Draw the money down inside the same transaction as the order.
            // If the balance cannot cover it, the exception rolls the order
            // back with it, so no order exists without its ledger entry.
            if ($allowanceEmployee !== null) {
                $ledgerEntry = Allowance::redeem($allowanceEmployee, $total, $order, auth()->user());

                if ($ledgerEntry === null) {
                    throw new InsufficientAllowanceException(
                        Allowance::balanceFor($allowanceEmployee)['remaining'],
                        $total,
                    );
                }
            }

            // Add order items
            foreach ($validated['items'] as $itemData) {
                $itemTotal = ($itemData['price'] * $itemData['quantity']) - ($itemData['discount'] ?? 0);
                
                // Determine product category based on ID ranges from frontend
                $categoryId = $this->getCategoryIdFromProductId($itemData['product_id']);
                
                $orderItem = $order->items()->create([
                    'product_id' => $itemData['product_id'], // Store frontend ID for consistency
                    'product_name' => $itemData['product_name'],
                    'quantity' => $itemData['quantity'],
                    'price' => $itemData['price'],
                    'variant' => $itemData['variant'] ?? null,
                    'customizations' => $itemData['customizations'] ?? null,
                    'discount' => $itemData['discount'] ?? 0,
                    'total' => $itemTotal,
                    'category' => $categoryId, // Store the category ID
                ]);

                // Add add-ons if any
                if (!empty($itemData['add_ons'])) {
                    foreach ($itemData['add_ons'] as $addOnData) {
                        $addOnCategoryId = $this->getCategoryIdFromProductId($addOnData['product_id']);
                        
                        $orderItem->addOns()->create([
                            'product_id' => $addOnData['product_id'],
                            'product_name' => $addOnData['product_name'],
                            'quantity' => $addOnData['quantity'] ?? 1,
                            'price' => $addOnData['price'],
                            'variant' => $addOnData['variant'] ?? null,
                            'customizations' => $addOnData['customizations'] ?? null,
                            'category' => $addOnCategoryId, // Also save category for add-ons
                        ]);
                    }
                }
            }

            DB::commit();

            $flash = [
                'message' => 'Order created successfully',
                'order_number' => $order->order_number,
            ];

            // Read back after the commit so the slip prints the balance the
            // ledger actually holds, not the figure the terminal was shown
            // when the QR was scanned.
            if ($allowanceEmployee !== null) {
                $flash['allowance_remaining'] = Allowance::balanceFor($allowanceEmployee)['remaining'];
            }

            return redirect()->back()->with($flash);

        } catch (InvalidOrderTotalException $e) {
            DB::rollBack();

            return back()->withErrors([$e->field => $e->getMessage()]);
        } catch (InsufficientAllowanceException $e) {
            DB::rollBack();

            return back()->withErrors(['payment' => $e->getMessage().' Payment rejected.']);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creating order: ' . $e->getMessage());
            
            return redirect()->back()->with('message', 'Failed to create order');
        }
    }

    /**
     * Display the specified order.
     */
    public function show(Order $order)
    {
        return Inertia::render('orders/show', [
            'order' => $order->load(['items.addOns', 'cashier:id,name'])
        ]);
    }
    
    /**
     * Map frontend product ID ranges to category IDs
     * The frontend assigns IDs based on category ranges:
     * - 1-99: Coffee (category ID: 1)
     * - 100-199: Blended Drinks (category ID: 2)
     * - 200-299: River Fizz (category ID: 3)
     * - 300-399: Black Trails (category ID: 4)
     * - 400-499: Greens & Grains (category ID: 5)
     * - 500-999: Add-Ons (no specific category)
     * - 1000+: Alternative Milk (no specific category)
     * 
     * @param string $productId Frontend product ID
     * @return int Category ID (1-5) or 0 for non-categorized products
     */
    private function getCategoryIdFromProductId($productId)
    {
        $id = (int) $productId;
        
        if ($id >= 1 && $id < 100) {
            return 1; // Coffee
        } else if ($id >= 100 && $id < 200) {
            return 2; // Blended Drinks
        } else if ($id >= 200 && $id < 300) {
            return 3; // River Fizz
        } else if ($id >= 300 && $id < 400) {
            return 4; // Black Trails
        } else if ($id >= 400 && $id < 500) {
            return 5; // Greens & Grains
        } else {
            return 0; // Add-ons or others
        }
    }
    
    /**
     * Void the specified order.
     */
    public function voidOrder(Order $order)
    {
        try {
            DB::beginTransaction();
            
            // Guard against a double void writing a second reversal and
            // refunding the allowance twice.
            if ($order->status === 'voided') {
                DB::rollBack();

                return redirect()->back()->with('message', 'This order is already voided');
            }

            $order->update([
                'status' => 'voided',
                'payment_status' => 'voided'
            ]);

            // Give the allowance back, booked against the period the spend
            // came from rather than whatever month it is now.
            $reversals = Allowance::reverseOrder($order, auth()->user(), 'Order '.$order->order_number.' voided');

            DB::commit();

            return redirect()->back()->with('message', $reversals->isNotEmpty()
                ? 'Order voided and allowance returned'
                : 'Order has been voided successfully');
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error voiding order: ' . $e->getMessage());
            
            return redirect()->back()->with('message', 'Failed to void order');
        }
    }
}
