<?php

namespace App\Http\Controllers;

use App\Models\SalesMonitoring;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class SalesMonitoringController extends Controller
{
    public function index()
    {
        $currentDate = Carbon::today();
        $monitoring = SalesMonitoring::where('monitoring_date', $currentDate)
            ->with(['openedBy', 'closedBy'])
            ->first();

        // Get recent monitoring records for history
        $recentMonitoring = SalesMonitoring::with(['openedBy', 'closedBy'])
            ->orderBy('monitoring_date', 'desc')
            ->take(10)
            ->get();

        // If no monitoring exists for today, create one
        if (!$monitoring) {
            $monitoring = $this->createTodayMonitoring();
        } else {
            // Update sales data from orders
            $this->updateSalesData($monitoring);
        }

        return Inertia::render('SalesMonitoring/Simple', [
            'currentMonitoring' => $monitoring->append(['total_sales', 'total_cash', 'total_gcash']),
            'recentMonitoring' => $recentMonitoring->map(function ($item) {
                return $item->append(['total_sales', 'total_cash', 'total_gcash']);
            }),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'monitoring_date' => 'required|date',
            'opening_balance' => 'required|numeric|min:0',
        ]);

        $monitoring = SalesMonitoring::create([
            'monitoring_date' => $validated['monitoring_date'],
            'opening_balance' => $validated['opening_balance'],
            'opened_by' => auth()->id(),
            'opened_at' => now(),
            'status' => 'open',
        ]);

        return redirect()->back()->with('success', 'Cash monitoring started for ' . $validated['monitoring_date']);
    }

    public function updateCashFlow(Request $request, SalesMonitoring $salesMonitoring)
    {
        $validated = $request->validate([
            'type' => 'required|in:cash_in,cash_out',
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'required|string|max:500',
        ]);

        $field = $validated['type'];
        $notesField = $validated['type'] . '_notes';

        $salesMonitoring->update([
            $field => $salesMonitoring->$field + $validated['amount'],
            $notesField => $salesMonitoring->$notesField . "\n" . now()->format('H:i') . ': +₱' . number_format($validated['amount'], 2) . ' - ' . $validated['notes'],
        ]);

        // Recalculate expected balance
        $salesMonitoring->update([
            'expected_balance' => $salesMonitoring->calculateExpectedBalance(),
        ]);

        return redirect()->back()->with('success', ucfirst(str_replace('_', ' ', $validated['type'])) . ' updated successfully');
    }

    public function close(Request $request, SalesMonitoring $salesMonitoring)
    {
        $validated = $request->validate([
            'actual_balance' => 'required|numeric|min:0',
            'variance_notes' => 'nullable|string|max:1000',
        ]);

        $expectedBalance = $salesMonitoring->calculateExpectedBalance();
        $variance = $validated['actual_balance'] - $expectedBalance;

        $salesMonitoring->update([
            'actual_balance' => $validated['actual_balance'],
            'expected_balance' => $expectedBalance,
            'variance' => $variance,
            'variance_notes' => $validated['variance_notes'],
            'status' => 'closed',
            'closed_by' => auth()->id(),
            'closed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Cash monitoring closed successfully');
    }

    private function createTodayMonitoring()
    {
        $yesterday = Carbon::yesterday();
        $yesterdayMonitoring = SalesMonitoring::where('monitoring_date', $yesterday)
            ->where('status', 'closed')
            ->first();

        $openingBalance = $yesterdayMonitoring ? $yesterdayMonitoring->actual_balance : 0;

        $monitoring = SalesMonitoring::create([
            'monitoring_date' => Carbon::today(),
            'opening_balance' => $openingBalance,
            'opened_by' => auth()->id(),
            'opened_at' => now(),
            'status' => 'open',
        ]);

        $this->updateSalesData($monitoring);
        return $monitoring;
    }

    private function updateSalesData(SalesMonitoring $monitoring)
    {
        $orders = Order::whereDate('created_at', $monitoring->monitoring_date)
            ->where('payment_status', 'completed')
            ->get();

        $cashSales = 0;
        $gcashSales = 0;
        $splitCashSales = 0;
        $splitGcashSales = 0;

        foreach ($orders as $order) {
            switch ($order->payment_method) {
                case 'Cash':
                    $cashSales += $order->total;
                    break;
                case 'GCash':
                case 'G-Cash':
                    $gcashSales += $order->total;
                    break;
                case 'Split (Cash + GCash)':
                    $splitCashSales += $order->split_cash_amount ?? 0;
                    $splitGcashSales += $order->split_gcash_amount ?? 0;
                    break;
            }
        }

        $monitoring->update([
            'cash_sales' => $cashSales,
            'gcash_sales' => $gcashSales,
            'split_cash_sales' => $splitCashSales,
            'split_gcash_sales' => $splitGcashSales,
            'expected_balance' => $monitoring->calculateExpectedBalance(),
        ]);
    }
}
