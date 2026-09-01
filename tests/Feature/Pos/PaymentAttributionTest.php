<?php

namespace Tests\Feature\Pos;

use App\Enums\PaymentMethod;
use App\Models\Order;
use App\Models\SalesMonitoring;
use App\Models\User;
use App\Support\PaymentBreakdown;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

/**
 * Task 0.2 — a new payment method reaches the reports, never inflates the
 * cash drawer, and an unrecognised method is not silently dropped.
 */
class PaymentAttributionTest extends TestCase
{
    use RefreshDatabase;

    private function order(string $method, float $total, array $extra = []): Order
    {
        return Order::create(array_merge([
            'subtotal' => $total,
            'discount' => 0,
            'total' => $total,
            'payment_method' => $method,
            'payment_status' => 'completed',
            'status' => 'completed',
        ], $extra));
    }

    private function monitoring(): SalesMonitoring
    {
        $this->actingAs(User::factory()->create())
            ->get('/sales-monitoring')
            ->assertOk();

        return SalesMonitoring::whereDate('monitoring_date', today())->sole();
    }

    public function test_employee_allowance_is_recorded_in_sales_monitoring(): void
    {
        $this->order(PaymentMethod::EmployeeAllowance->value, 150);

        $monitoring = $this->monitoring();

        $this->assertEquals(150, $monitoring->allowance_sales);
        $this->assertEquals(150, $monitoring->total_sales);
    }

    public function test_employee_allowance_does_not_increase_the_cash_drawer(): void
    {
        $this->order(PaymentMethod::EmployeeAllowance->value, 150);

        $monitoring = $this->monitoring();

        $this->assertEquals(0, $monitoring->cash_sales);
        $this->assertEquals(0, $monitoring->total_cash);
        // Opening balance is 0 and no cash was taken, so the drawer must stay flat.
        $this->assertEquals(0, $monitoring->expected_balance);
    }

    public function test_allowance_alongside_cash_leaves_only_the_cash_in_the_drawer(): void
    {
        $this->order(PaymentMethod::Cash->value, 200);
        $this->order(PaymentMethod::EmployeeAllowance->value, 150);

        $monitoring = $this->monitoring();

        $this->assertEquals(200, $monitoring->cash_sales);
        $this->assertEquals(150, $monitoring->allowance_sales);
        $this->assertEquals(350, $monitoring->total_sales);
        $this->assertEquals(200, $monitoring->expected_balance);
    }

    public function test_unknown_payment_method_is_reported_and_logged_not_dropped(): void
    {
        Log::spy();

        // Simulates a legacy row written before the method was constrained.
        $this->order('Crypto', 75);

        $monitoring = $this->monitoring();

        $this->assertEquals(75, $monitoring->other_sales);
        $this->assertEquals(75, $monitoring->total_sales);
        $this->assertEquals(0, $monitoring->expected_balance);

        Log::shouldHaveReceived('warning')
            ->withArgs(fn ($message, $context) => $message === 'Unrecognised payment method on order'
                && $context['payment_method'] === 'Crypto');
    }

    public function test_existing_methods_are_still_attributed_correctly(): void
    {
        $this->order(PaymentMethod::Cash->value, 100);
        $this->order(PaymentMethod::GCash->value, 50);
        $this->order(PaymentMethod::Split->value, 90, [
            'split_cash_amount' => 60,
            'split_gcash_amount' => 30,
        ]);

        $monitoring = $this->monitoring();

        $this->assertEquals(100, $monitoring->cash_sales);
        $this->assertEquals(50, $monitoring->gcash_sales);
        $this->assertEquals(60, $monitoring->split_cash_sales);
        $this->assertEquals(30, $monitoring->split_gcash_sales);
        $this->assertEquals(240, $monitoring->total_sales);
        // Only cash and the cash half of the split reach the till.
        $this->assertEquals(160, $monitoring->expected_balance);
    }

    public function test_legacy_gcash_spelling_is_still_attributed(): void
    {
        $this->order('G-Cash', 40);

        $monitoring = $this->monitoring();

        $this->assertEquals(40, $monitoring->gcash_sales);
        $this->assertEquals(0, $monitoring->other_sales);
        $this->assertEquals(0, $monitoring->expected_balance);
    }

    public function test_z_report_lists_employee_allowance_as_its_own_method(): void
    {
        $this->order(PaymentMethod::Cash->value, 100);
        $this->order(PaymentMethod::EmployeeAllowance->value, 150);

        $this->actingAs(User::factory()->create())
            ->get('/reports/z-report/generate?date='.today()->toDateString())
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('reportData.paymentMethodTotals.Employee Allowance.total', fn ($v) => (float) $v === 150.0)
                ->where('reportData.paymentMethodTotals.Employee Allowance.count', 1)
                ->where('reportData.paymentMethodTotals.Cash.total', fn ($v) => (float) $v === 100.0)
            );
    }

    public function test_z_report_still_allocates_split_payments_to_cash_and_gcash(): void
    {
        $this->order(PaymentMethod::Split->value, 90, [
            'split_cash_amount' => 60,
            'split_gcash_amount' => 30,
        ]);

        $this->actingAs(User::factory()->create())
            ->get('/reports/z-report/generate?date='.today()->toDateString())
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('reportData.paymentMethodTotals.Cash.total', fn ($v) => (float) $v === 60.0)
                ->where('reportData.paymentMethodTotals.GCash.total', fn ($v) => (float) $v === 30.0)
                ->missing('reportData.paymentMethodTotals.Split (Cash + GCash)')
            );
    }

    public function test_allocations_always_sum_to_the_amount_collected(): void
    {
        $split = $this->order(PaymentMethod::Split->value, 90, [
            'split_cash_amount' => 60,
            'split_gcash_amount' => 30,
        ]);
        $allowance = $this->order(PaymentMethod::EmployeeAllowance->value, 150);
        $unknown = $this->order('Crypto', 75);

        foreach ([$split, $allowance, $unknown] as $order) {
            $sum = collect(PaymentBreakdown::allocate($order))->sum('amount');
            $this->assertEqualsWithDelta((float) $order->total, $sum, 0.001);
        }
    }
}
