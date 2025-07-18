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
            
        // Categories to track (using IDs)
        $trackedCategories = [1, 2, 3, 4, 5];
        
        $categoryNames = Category::whereIn('id', $trackedCategories)->pluck('name')->toArray();
        
        // Get cup counts by category using a direct query
        $categoryCounts = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->select('products.category', DB::raw('SUM(order_items.quantity) as total_cups'))
            ->where('orders.status', 'completed')
            ->whereBetween('orders.created_at', [$startTimestamp, $endTimestamp])
            ->whereIn('products.category', $trackedCategories)
            ->groupBy('products.category')
            ->pluck('total_cups', 'category')
            ->toArray();
            
        // Fill in any missing categories with zero
        foreach ($trackedCategories as $categoryId) {
            if (!isset($categoryCounts[$categoryId])) {
                $categoryCounts[$categoryId] = 0;
            }
        }

        // Get total cup count
        $totalCups = array_sum($categoryCounts);
        
        // Map category IDs back to names for frontend display
        $namedCategoryCounts = [];
        foreach ($categoryCounts as $id => $count) {
            $name = $categoryNames[$id] ?? "Category {$id}";
            $namedCategoryCounts[$name] = $count;
        }
        
        // Format dates for display
        $formattedStartDate = $startDate->format('Y-m-d');
        $formattedEndDate = $endDate->format('Y-m-d');
        
        return Inertia::render('dashboard', [
            'salesData' => [
                'rangeSales' => $rangeSales,
                'totalCups' => $totalCups,
                'categoryCounts' => $namedCategoryCounts,
                'startDate' => $formattedStartDate,
                'endDate' => $formattedEndDate
            ]
        ]);
    }
}
