<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * Show the Z-Report form
     */
    public function showZReportForm()
    {
        return Inertia::render('reports/z-report', [
            'reportData' => null
        ]);
    }

    /**
     * Generate Z-Report data
     */
    public function generateZReport(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
        ]);

        $date = $request->date;
        $startDate = Carbon::parse($date)->startOfDay();
        $endDate = Carbon::parse($date)->endOfDay();

        // Get only completed orders for the specified date
        $orders = Order::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->with('items.addOns')
            ->get();

        // Count total orders and calculate totals
        $totalOrders = $orders->count();
        $grossSales = $orders->sum('subtotal');
        $discounts = $orders->sum('discount');
        $netSales = $orders->sum('total');

        // Calculate sales by payment method
        $paymentMethodTotals = $orders->groupBy('payment_method')
            ->map(function ($orderGroup) {
                return [
                    'count' => $orderGroup->count(),
                    'total' => $orderGroup->sum('total'),
                ];
            });

        // Get all products sold ordered by top-selling first
        $allProductsSold = OrderItem::whereIn('order_id', $orders->pluck('id'))
            ->select('product_name', DB::raw('SUM(quantity) as quantity_sold'), DB::raw('SUM(total) as total_sales'))
            ->groupBy('product_name')
            ->orderByDesc('quantity_sold')
            ->get();

        $reportData = [
            'date' => $date,
            'totalOrders' => $totalOrders,
            'grossSales' => $grossSales,
            'discounts' => $discounts,
            'netSales' => $netSales,
            'paymentMethodTotals' => $paymentMethodTotals,
            'allProductsSold' => $allProductsSold,
        ];

        // Return an Inertia response with the report data
        return Inertia::render('reports/z-report', [
            'reportData' => $reportData
        ]);
    }
}
