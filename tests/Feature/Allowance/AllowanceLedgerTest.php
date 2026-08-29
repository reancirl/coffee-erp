<?php

namespace Tests\Feature\Allowance;

use App\Models\AllowanceTransaction;
use App\Models\Order;
use App\Models\User;
use App\Support\Allowance;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The ledger behind "Used" and "Remaining".
 */
class AllowanceLedgerTest extends TestCase
{
    use RefreshDatabase;

    private function employee(): User
    {
        $user = User::factory()->create(['name' => 'Juan Dela Cruz', 'allowance_eligible' => true]);
        $user->assignEmployeeCode();

        $this->travelTo(CarbonImmutable::parse('2026-08-29 10:00', config('allowance.timezone'))->utc());

        return $user->refresh();
    }

    public function test_a_redemption_reduces_the_remaining_balance(): void
    {
        $juan = $this->employee();

        $transaction = Allowance::redeem($juan, 150);

        $this->assertNotNull($transaction);
        $this->assertEquals(-150, $transaction->amount);
        $this->assertSame(AllowanceTransaction::TYPE_REDEMPTION, $transaction->type);
        $this->assertSame(850.0, Allowance::balanceFor($juan)['remaining']);
    }

    public function test_a_redemption_cannot_overdraw_the_period(): void
    {
        $juan = $this->employee();

        Allowance::redeem($juan, 900);
        $rejected = Allowance::redeem($juan, 150);

        $this->assertNull($rejected);
        // Nothing was written, so the balance is untouched.
        $this->assertSame(100.0, Allowance::balanceFor($juan)['remaining']);
        $this->assertSame(1, $juan->allowanceTransactions()->count());
    }

    public function test_spending_the_exact_remaining_balance_is_allowed(): void
    {
        $juan = $this->employee();

        Allowance::redeem($juan, 900);

        $this->assertNotNull(Allowance::redeem($juan, 100));
        $this->assertSame(0.0, Allowance::balanceFor($juan)['remaining']);
    }

    public function test_zero_and_negative_amounts_are_refused(): void
    {
        $juan = $this->employee();

        $this->assertNull(Allowance::redeem($juan, 0));
        $this->assertNull(Allowance::redeem($juan, -50));
        $this->assertSame(0, $juan->allowanceTransactions()->count());
    }

    public function test_an_ineligible_employee_cannot_redeem(): void
    {
        $juan = $this->employee();
        $juan->update(['allowance_eligible' => false]);

        $this->assertNull(Allowance::redeem($juan->fresh(), 150));
    }

    public function test_a_refund_restores_the_balance_to_the_original_period(): void
    {
        $juan = $this->employee();
        $spend = Allowance::redeem($juan, 650);

        $refund = Allowance::refund($spend, null, 'Order voided');

        $this->assertEquals(650, $refund->amount);
        $this->assertSame($spend->allowance_period_id, $refund->allowance_period_id);
        $this->assertSame(1000.0, Allowance::balanceFor($juan)['remaining']);
        $this->assertSame(0.0, Allowance::balanceFor($juan)['used']);
    }

    public function test_the_ledger_is_append_only(): void
    {
        $juan = $this->employee();
        $transaction = Allowance::redeem($juan, 150);

        $this->expectException(\LogicException::class);
        $transaction->update(['amount' => -1]);
    }

    public function test_ledger_rows_cannot_be_deleted(): void
    {
        $juan = $this->employee();
        $transaction = Allowance::redeem($juan, 150);

        $this->expectException(\LogicException::class);
        $transaction->delete();
    }

    public function test_a_redemption_can_be_traced_to_its_order_and_cashier(): void
    {
        $juan = $this->employee();
        $cashier = User::factory()->create(['name' => 'Maria']);

        $order = Order::create([
            'user_id' => $cashier->id,
            'allowance_user_id' => $juan->id,
            'subtotal' => 150, 'discount' => 0, 'total' => 150,
            'payment_method' => 'Employee Allowance',
            'payment_status' => 'completed', 'status' => 'completed',
        ]);

        $transaction = Allowance::redeem($juan, 150, $order, $cashier);

        $this->assertSame($order->id, $transaction->order_id);
        $this->assertSame($cashier->id, $transaction->recorded_by);
        $this->assertSame($order->order_number, $transaction->description);
        $this->assertSame('Maria', $transaction->recordedBy->name);
        $this->assertSame('Juan Dela Cruz', $transaction->user->name);
    }

    public function test_an_untouched_period_reports_a_plain_zero_not_negative_zero(): void
    {
        $juan = $this->employee();

        $used = Allowance::balanceFor($juan)['used'];

        $this->assertSame(0.0, $used);
        // -0.0 == 0.0, so compare the formatted value to catch the sign.
        $this->assertSame('0', (string) $used);
    }

    public function test_a_fully_refunded_period_also_reports_a_plain_zero(): void
    {
        $juan = $this->employee();
        Allowance::refund(Allowance::redeem($juan, 650));

        $this->assertSame('0', (string) Allowance::balanceFor($juan)['used']);
    }

    public function test_many_small_redemptions_stay_exact(): void
    {
        $juan = $this->employee();

        // Amounts that float arithmetic tends to smear.
        foreach ([0.1, 0.2, 99.7, 150.05, 249.95] as $amount) {
            $this->assertNotNull(Allowance::redeem($juan, $amount));
        }

        $this->assertSame(500.0, Allowance::balanceFor($juan)['used']);
        $this->assertSame(500.0, Allowance::balanceFor($juan)['remaining']);
    }
}
