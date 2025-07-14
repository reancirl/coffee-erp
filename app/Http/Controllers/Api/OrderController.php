<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemAddOn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created order in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'payment_method' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.product_name' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.variant' => 'nullable|string|in:hot,iced',
            'items.*.customizations' => 'nullable|array',
            'items.*.discount' => 'nullable|numeric|min:0',
            'items.*.add_ons' => 'nullable|array',
            'items.*.add_ons.*.product_id' => 'required|exists:products,id',
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
                'subtotal' => $subtotal,
                'discount' => $discount,
                'total' => $total,
                'payment_method' => $validated['payment_method'],
                'payment_status' => 'pending',
                'status' => 'pending',
                'notes' => $validated['notes'] ?? null,
            ]);

            // Add order items
            foreach ($validated['items'] as $itemData) {
                $itemTotal = ($itemData['price'] * $itemData['quantity']) - ($itemData['discount'] ?? 0);
                
                $orderItem = $order->items()->create([
                    'product_id' => $itemData['product_id'],
                    'product_name' => $itemData['product_name'],
                    'quantity' => $itemData['quantity'],
                    'price' => $itemData['price'],
                    'variant' => $itemData['variant'] ?? null,
                    'customizations' => $itemData['customizations'] ?? null,
                    'discount' => $itemData['discount'] ?? 0,
                    'total' => $itemTotal,
                ]);

                // Add add-ons if any
                if (!empty($itemData['add_ons'])) {
                    foreach ($itemData['add_ons'] as $addOnData) {
                        $orderItem->addOns()->create([
                            'product_id' => $addOnData['product_id'],
                            'product_name' => $addOnData['product_name'],
                            'quantity' => $addOnData['quantity'] ?? 1,
                            'price' => $addOnData['price'],
                            'variant' => $addOnData['variant'] ?? null,
                            'customizations' => $addOnData['customizations'] ?? null,
                        ]);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Order created successfully',
                'order' => $order->load('items.addOns')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creating order: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to create order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
