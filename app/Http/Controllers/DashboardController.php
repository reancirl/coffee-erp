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
        
        // Load category map for readable labels
        $categoryMap = Category::pluck('name', 'id');
        $beverageCategoryIds = Category::whereIn('name', [
            'Coffee',
            'Blended Drinks',
            'River Fizz',
            'Black Trails',
            'Greens & Grains',
        ])->pluck('id')->toArray();
        $foodCategoryIds = Category::where('name', 'Food')->pluck('id')->toArray();
        
        // Set start and end timestamps
        $startTimestamp = $startDate->copy()->startOfDay();
        $endTimestamp = $endDate->copy()->endOfDay();
        
        // Get total sales for selected date range (completed orders only)
        $rangeSales = Order::where('status', 'completed')
            ->whereBetween('created_at', [$startTimestamp, $endTimestamp])
            ->sum('total');
            
        // Get product-level cup counts (only for specified categories)
        $productCounts = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->select('products.name', DB::raw('SUM(order_items.quantity) as total_cups'))
            ->where('orders.status', 'completed')
            ->whereBetween('orders.created_at', [$startTimestamp, $endTimestamp])
            ->whereIn('products.category', $beverageCategoryIds)
            ->whereNotNull('products.name')
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
            ->whereIn('products.category', $beverageCategoryIds)
            ->whereBetween('orders.created_at', [$startOfWeek, $endOfWeek])
            ->sum('order_items.quantity');
            
        // Get daily cups data for the graph (only for specified categories)
        $dailyCups = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->select(DB::raw('DATE(orders.created_at) as date'), DB::raw('SUM(order_items.quantity) as cups'))
            ->where('orders.status', 'completed')
            ->whereIn('products.category', $beverageCategoryIds)
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
        
        // Get food/pastry item counts
        $foodProductCounts = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->select('products.name', DB::raw('SUM(order_items.quantity) as total_items'))
            ->where('orders.status', 'completed')
            ->whereBetween('orders.created_at', [$startTimestamp, $endTimestamp])
            ->whereIn('products.category', $foodCategoryIds)
            ->whereNotNull('products.name')
            ->groupBy('products.name')
            ->orderBy('total_items', 'desc')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->name => $item->total_items];
            })
            ->toArray();

        $totalFoodItems = array_sum($foodProductCounts);

        // Sales for food/pastry category
        $foodSales = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->where('orders.status', 'completed')
            ->whereBetween('orders.created_at', [$startTimestamp, $endTimestamp])
            ->whereIn('products.category', $foodCategoryIds)
            ->sum('order_items.total');

        // Sales and quantity by category for charts
        $categoryBreakdown = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->leftJoin('products', 'products.id', '=', 'order_items.product_id')
            ->select('products.category', DB::raw('SUM(order_items.total) as sales'), DB::raw('SUM(order_items.quantity) as quantity'))
            ->where('orders.status', 'completed')
            ->whereBetween('orders.created_at', [$startTimestamp, $endTimestamp])
            ->whereNotNull('products.category')
            ->groupBy('products.category')
            ->get()
            ->map(function ($item) use ($categoryMap) {
                $categoryName = $categoryMap[$item->category] ?? 'Uncategorized';
                return [
                    'category' => $categoryName,
                    'sales' => (float) $item->sales,
                    'quantity' => (int) $item->quantity,
                ];
            })
            ->values();

        // Daily sales data for the selected date range
        $dailySales = Order::where('status', 'completed')
            ->whereBetween('created_at', [$startTimestamp, $endTimestamp])
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total) as sales'))
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'sales' => (float) $item->sales,
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
                'foodProductCounts' => $foodProductCounts,
                'totalFoodItems' => $totalFoodItems,
                'foodSales' => $foodSales,
                'categoryBreakdown' => $categoryBreakdown,
                'dailySales' => $dailySales,
                'dailyCups' => $dailyCups,
                'startDate' => $formattedStartDate,
                'endDate' => $formattedEndDate
            ]
        ]);
    }
}
