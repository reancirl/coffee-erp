<?php

namespace App\Support;

use App\Enums\PaymentMethod;
use App\Models\Order;
use Illuminate\Support\Facades\Log;

/**
 * Single place that decides how an order's money is attributed.
 *
 * Both the cash-drawer monitoring and the Z-Report consume this, so a new
 * payment method only has to be taught here once. An unrecognised method is
 * still allocated (never dropped) and is flagged so callers can surface it.
 */
class PaymentBreakdown
{
    /**
     * Split one order into its (method, amount) allocations.
     *
     * A split payment yields up to two allocations; every other method yields
     * exactly one for the full order total. The amounts of the returned
     * allocations always sum to the amount that was actually collected.
     *
     * @return array<int, array{method: ?PaymentMethod, raw: string, amount: float, from_split: bool, drawer: bool}>
     */
    public static function allocate(Order $order): array
    {
        $raw = (string) $order->payment_method;
        $method = PaymentMethod::tryFromLabel($raw);

        if ($method === null) {
            // Do not silently drop it: keep the money visible under its raw
            // label and leave it out of the drawer, where a wrong guess would
            // corrupt the variance.
            Log::warning('Unrecognised payment method on order', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'payment_method' => $raw,
                'total' => (float) $order->total,
            ]);

            return [[
                'method' => null,
                'raw' => $raw,
                'amount' => (float) $order->total,
                'from_split' => false,
                'drawer' => false,
            ]];
        }

        if ($method->isSplit()) {
            $allocations = [];

            $cash = (float) ($order->split_cash_amount ?? 0);
            if ($cash > 0) {
                $allocations[] = [
                    'method' => PaymentMethod::Cash,
                    'raw' => PaymentMethod::Cash->value,
                    'amount' => $cash,
                    'from_split' => true,
                    'drawer' => true,
                ];
            }

            $gcash = (float) ($order->split_gcash_amount ?? 0);
            if ($gcash > 0) {
                $allocations[] = [
                    'method' => PaymentMethod::GCash,
                    'raw' => PaymentMethod::GCash->value,
                    'amount' => $gcash,
                    'from_split' => true,
                    'drawer' => false,
                ];
            }

            return $allocations;
        }

        return [[
            'method' => $method,
            'raw' => $method->value,
            'amount' => (float) $order->total,
            'from_split' => false,
            'drawer' => $method->increasesCashDrawer(),
        ]];
    }

    /**
     * Totals per sales-monitoring column for a set of orders.
     *
     * @param  iterable<Order>  $orders
     * @return array{cash_sales: float, gcash_sales: float, split_cash_sales: float, split_gcash_sales: float, allowance_sales: float, other_sales: float}
     */
    public static function monitoringTotals(iterable $orders): array
    {
        $totals = [
            'cash_sales' => 0.0,
            'gcash_sales' => 0.0,
            'split_cash_sales' => 0.0,
            'split_gcash_sales' => 0.0,
            'allowance_sales' => 0.0,
            'other_sales' => 0.0,
        ];

        foreach ($orders as $order) {
            foreach (self::allocate($order) as $allocation) {
                $column = match (true) {
                    $allocation['method'] === PaymentMethod::Cash => $allocation['from_split'] ? 'split_cash_sales' : 'cash_sales',
                    $allocation['method'] === PaymentMethod::GCash => $allocation['from_split'] ? 'split_gcash_sales' : 'gcash_sales',
                    $allocation['method'] === PaymentMethod::EmployeeAllowance => 'allowance_sales',
                    default => 'other_sales',
                };

                $totals[$column] += $allocation['amount'];
            }
        }

        return $totals;
    }

    /**
     * Per-method count and total, with split payments attributed to the
     * underlying Cash/GCash methods. Keyed by the method label.
     *
     * @param  iterable<Order>  $orders
     * @return array<string, array{count: int, total: float}>
     */
    public static function totalsByMethod(iterable $orders): array
    {
        $totals = [];

        foreach ($orders as $order) {
            foreach (self::allocate($order) as $allocation) {
                $label = $allocation['raw'];
                $existing = $totals[$label] ?? ['count' => 0, 'total' => 0.0];

                $totals[$label] = [
                    'count' => $existing['count'] + 1,
                    'total' => $existing['total'] + $allocation['amount'],
                ];
            }
        }

        return $totals;
    }
}
