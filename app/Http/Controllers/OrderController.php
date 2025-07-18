<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemAddOn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
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
        $query = Order::with('items');
        
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
            ]
        ]);
    }

    /**
     * Store a newly created order in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'payment_method' => 'required|string',
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
        ]);

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

            // Create the order
            $order = Order::create([
                'order_number' => 'ORD-' . strtoupper(Str::random(8)),
                'subtotal' => $subtotal,
                'discount' => $discount,
                'total' => $total,
                'payment_method' => $validated['payment_method'],
                'payment_status' => 'completed',
                'status' => 'completed',
                'order_type' => $validated['order_type'] ?? 'dine-in',
                'beeper_number' => $validated['beeper_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'user_id' => auth()->id(),
            ]);

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

            return redirect()->back()->with('message', 'Order created successfully');

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
            'order' => $order->load('items.addOns')
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
            
            $order->update([
                'status' => 'voided',
                'payment_status' => 'voided'
            ]);
            
            DB::commit();
            return redirect()->back()->with('message', 'Order has been voided successfully');
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error voiding order: ' . $e->getMessage());
            
            return redirect()->back()->with('message', 'Failed to void order');
        }
    }
}
