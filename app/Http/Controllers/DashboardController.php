<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Category;
use App\Models\OrderItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // Get date parameters from request or use today as default
        $startDate = $request->input('start_date') ? Carbon::parse($request->input('start_date')) : Carbon::today();
        $endDate = $request->input('end_date') ? Carbon::parse($request->input('end_date')) : Carbon::today();
        
        // Set start and end timestamps
        $startTimestamp = $startDate->copy()->startOfDay();
        $endTimestamp = $endDate->copy()->endOfDay();
        
        // Get total sales for selected date range (completed orders only)
        $rangeSales = Order::where('status', 'completed')
            ->whereBetween('created_at', [$startTimestamp, $endTimestamp])
            ->sum('total');
            
        // Categories that represent cups (IDs 1-5)
        $cupCategories = [1, 2, 3, 4, 5];
        
        // Get product-level cup counts (only for specified categories)
        $productCounts = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->select('products.name', DB::raw('SUM(order_items.quantity) as total_cups'))
            ->where('orders.status', 'completed')
            ->whereBetween('orders.created_at', [$startTimestamp, $endTimestamp])
            ->whereIn('products.category', $cupCategories)
            ->groupBy('products.name')
            ->orderBy('total_cups', 'desc')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->name => $item->total_cups];
            })
            ->toArray();

        // Get total cup count
        $totalCups = array_sum($productCounts);
        
        // Get total cups for the current week (only for specified categories)
        $startOfWeek = Carbon::now()->startOfWeek();
        $endOfWeek = Carbon::now()->endOfWeek();
        
        $totalCupsThisWeek = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->where('orders.status', 'completed')
            ->whereIn('products.category', $cupCategories)
            ->whereBetween('orders.created_at', [$startOfWeek, $endOfWeek])
            ->sum('order_items.quantity');
            
        // Get daily cups data for the graph (only for specified categories)
        $dailyCups = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->select(DB::raw('DATE(orders.created_at) as date'), DB::raw('SUM(order_items.quantity) as cups'))
            ->where('orders.status', 'completed')
            ->whereIn('products.category', $cupCategories)
            ->whereBetween('orders.created_at', [$startTimestamp, $endTimestamp])
            ->groupBy(DB::raw('DATE(orders.created_at)'))
            ->orderBy('date')
            ->get()
            ->map(function($item) {
                return [
                    'date' => $item->date,
                    'cups' => (int) $item->cups
                ];
            });
        
        // Format dates for display
        $formattedStartDate = $startDate->format('Y-m-d');
        $formattedEndDate = $endDate->format('Y-m-d');
        
        return Inertia::render('dashboard', [
            'salesData' => [
                'rangeSales' => $rangeSales,
                'totalCups' => $totalCups,
                'totalCupsThisWeek' => $totalCupsThisWeek,
                'productCounts' => $productCounts,
                'dailyCups' => $dailyCups,
                'startDate' => $formattedStartDate,
                'endDate' => $formattedEndDate
            ]
        ]);
    }
}
