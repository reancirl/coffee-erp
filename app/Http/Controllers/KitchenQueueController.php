<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class KitchenQueueController extends Controller
{
    /**
     * Display the kitchen queue interface
     */
    public function index()
    {
        // Get pending orders (not completed) ordered by creation time (FIFO)
        $pendingOrders = Order::with(['items.addOns'])
            ->where('status', '!=', 'completed')
            ->whereDate('created_at', Carbon::today())
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'order_type' => $order->order_type,
                    'beeper_number' => $order->beeper_number,
                    'created_at' => $order->created_at,
                    'time_elapsed' => $this->getTimeElapsed($order->created_at),
                    'items' => $order->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'product_name' => $item->product_name,
                            'quantity' => $item->quantity,
                            'variant' => $item->variant,
                            'customizations' => $item->customizations,
                            'add_ons' => $item->addOns->map(function ($addOn) {
                                return [
                                    'product_name' => $addOn->product_name,
                                    'variant' => $addOn->variant,
                                    'customizations' => $addOn->customizations,
                                ];
                            }),
                        ];
                    }),
                    'notes' => $order->notes,
                ];
            });

        return Inertia::render('kitchen-queue/Index', [
            'orders' => $pendingOrders
        ]);
    }

    /**
     * Mark an order as completed
     */
    public function completeOrder(Request $request, Order $order)
    {
        $order->update([
            'status' => 'completed'
        ]);

        return response()->json([
            'success' => true,
            'message' => "Order {$order->order_number} marked as completed"
        ]);
    }

    /**
     * Get time elapsed since order creation
     */
    private function getTimeElapsed($createdAt)
    {
        $now = Carbon::now();
        $created = Carbon::parse($createdAt);
        $diffInMinutes = $created->diffInMinutes($now);

        if ($diffInMinutes < 60) {
            return $diffInMinutes . 'm';
        } else {
            $hours = floor($diffInMinutes / 60);
            $minutes = $diffInMinutes % 60;
            return $hours . 'h ' . $minutes . 'm';
        }
    }

    /**
     * Get real-time queue data (for polling/refresh)
     */
    public function getQueueData()
    {
        $pendingOrders = Order::with(['items.addOns'])
            ->where('status', '!=', 'completed')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'order_type' => $order->order_type,
                    'beeper_number' => $order->beeper_number,
                    'created_at' => $order->created_at,
                    'time_elapsed' => $this->getTimeElapsed($order->created_at),
                    'items' => $order->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'product_name' => $item->product_name,
                            'quantity' => $item->quantity,
                            'variant' => $item->variant,
                            'customizations' => $item->customizations,
                            'add_ons' => $item->addOns->map(function ($addOn) {
                                return [
                                    'product_name' => $addOn->product_name,
                                    'variant' => $addOn->variant,
                                    'customizations' => $addOn->customizations,
                                ];
                            }),
                        ];
                    }),
                    'notes' => $order->notes,
                ];
            });

        return response()->json([
            'orders' => $pendingOrders
        ]);
    }
}
