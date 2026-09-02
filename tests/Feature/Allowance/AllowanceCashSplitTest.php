<?php

namespace Tests\Feature\Allowance;

use App\Enums\PaymentMethod;
use App\Models\AllowanceTransaction;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Support\Allowance;
use App\Support\EmployeeQr;
use App\Support\PaymentBreakdown;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Task 8.2 — when the allowance will not cover the order, the employee can
 * put the rest in cash rather than abandoning the sale.
 *
 * The allowance half is a redemption like any other; the cash half is cash
 * in the drawer. The two must never be confused for each other, which is
 * what most of this covers.
 */
class AllowanceCashSplitTest extends TestCase
{
    use RefreshDatabase;

    private User $cashier;

    private User $juan;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cashier = User::factory()->create(['name' => 'Maria']);
        $this->juan = User::factory()->create(['name' => 'Juan Dela Cruz', 'allowance_eligible' => true]);
        $this->grantAllowanceRole($this->juan);
        $this->juan->assignEmployeeCode();
        $this->juan->refresh();
        $this->token = EmployeeQr::issueFor($this->juan)->token;
    }

    private function split(float $total, float $fromAllowance, float $fromCash, array $overrides = [])
    {
        return $this->actingAs($this->cashier)->from('/pos')->post('/orders', array_merge([
            'payment_method' => PaymentMethod::SplitAllowanceCash->value,
            'employee_qr_token' => $this->token,
            'order_type' => 'dine-in',
            'split_allowance_amount' => $fromAllowance,
            'split_cash_amount' => $fromCash,
            'items' => [[
                'product_id' => 1,
                'product_name' => 'Coffee',
                'quantity' => 1,
                'price' => $total,
            ]],
        ], $overrides));
    }

    /** Spend the allowance down to $remaining. */
    private function drainTo(float $remaining): void
    {
        Allowance::redeem($this->juan, 1000 - $remaining, null, $this->cashier);
    }

    // ---------- the happy path ----------

    public function test_the_allowance_covers_what_it_can_and_cash_covers_the_rest(): void
    {
        $this->drainTo(100);

        $this->split(150, 100, 50)->assertSessionHasNoErrors();

        $order = Order::sole();
        $this->assertSame(PaymentMethod::SplitAllowanceCash->value, $order->payment_method);
        $this->assertEquals(100, $order->split_allowance_amount);
        $this->assertEquals(50, $order->split_cash_amount);
        $this->assertNull($order->split_gcash_amount);
    }

    public function test_only_the_allowance_half_is_drawn_from_the_balance(): void
    {
        $this->drainTo(100);

        $this->split(150, 100, 50)->assertSessionHasNoErrors();

        // The ₱50 of cash must not touch the ledger.
        $redemption = AllowanceTransaction::where('order_id', Order::sole()->id)->sole();
        $this->assertEquals(-100, $redemption->amount);
        $this->assertEqualsWithDelta(0, Allowance::balanceFor($this->juan)['remaining'], 0.001);
    }

    public function test_the_cash_half_reaches_the_drawer_and_the_allowance_half_does_not(): void
    {
        $this->drainTo(100);
        $this->split(150, 100, 50);

        $allocations = PaymentBreakdown::allocate(Order::sole());

        $this->assertCount(2, $allocations);

        $allowance = collect($allocations)->firstWhere('method', PaymentMethod::EmployeeAllowance);
        $cash = collect($allocations)->firstWhere('method', PaymentMethod::Cash);

        $this->assertEqualsWithDelta(100, $allowance['amount'], 0.001);
        $this->assertFalse($allowance['drawer']);

        $this->assertEqualsWithDelta(50, $cash['amount'], 0.001);
        $this->assertTrue($cash['drawer']);
    }

    public function test_sales_monitoring_splits_it_across_the_right_columns(): void
    {
        $this->drainTo(100);
        $this->split(150, 100, 50);

        $totals = PaymentBreakdown::monitoringTotals(Order::all());

        $this->assertEqualsWithDelta(100, $totals['allowance_sales'], 0.001);
        $this->assertEqualsWithDelta(50, $totals['split_cash_sales'], 0.001);
        $this->assertEqualsWithDelta(0, $totals['cash_sales'], 0.001);
        $this->assertEqualsWithDelta(0, $totals['other_sales'], 0.001);
    }

    // ---------- the limits ----------

    public function test_the_allowance_half_cannot_exceed_the_balance(): void
    {
        $this->drainTo(100);

        $this->split(150, 120, 30)->assertSessionHasErrors('payment');

        $this->assertSame(0, Order::count());
        $this->assertEqualsWithDelta(100, Allowance::balanceFor($this->juan)['remaining'], 0.001);
    }

    public function test_the_two_halves_must_add_up_to_the_order_total(): void
    {
        $this->split(150, 100, 40)->assertSessionHasErrors('payment');

        $this->assertSame(0, Order::count());
        $this->assertSame(0, AllowanceTransaction::count());
    }

    public function test_a_split_needs_both_halves(): void
    {
        $this->split(150, 150, 0)->assertSessionHasErrors('payment');
        $this->split(150, 0, 150)->assertSessionHasErrors('payment');

        $this->assertSame(0, Order::count());
    }

    public function test_a_split_still_needs_a_scanned_employee(): void
    {
        $this->split(150, 100, 50, ['employee_qr_token' => null])
            ->assertSessionHasErrors('payment');

        $this->assertSame(0, Order::count());
    }

    public function test_a_split_still_respects_product_eligibility(): void
    {
        $merch = Category::create(['name' => 'Merchandise', 'allowance_eligible' => false]);
        $tote = Product::create(['name' => 'Tote Bag', 'price' => 150, 'category' => $merch->id]);

        $this->split(150, 100, 50, ['items' => [[
            'product_id' => $tote->id,
            'product_name' => $tote->name,
            'quantity' => 1,
            'price' => 150,
        ]]])->assertSessionHasErrors('payment');

        $this->assertSame(0, Order::count());
    }

    // ---------- undoing it ----------

    public function test_voiding_gives_back_only_the_allowance_half(): void
    {
        $this->drainTo(100);
        $this->split(150, 100, 50);

        $order = Order::sole();

        $this->actingAs($this->cashier)->from('/orders')
            ->patch("/orders/{$order->id}/void")
            ->assertSessionHasNoErrors();

        // Back to ₱100, not ₱150: the cash was never the allowance's to give.
        $this->assertEqualsWithDelta(100, Allowance::balanceFor($this->juan)['remaining'], 0.001);
    }

    // ---------- what the slip is told ----------

    public function test_the_slip_gets_the_balance_left_after_the_allowance_half(): void
    {
        $this->drainTo(100);

        $this->split(150, 60, 90)->assertSessionHasNoErrors();

        $this->assertEqualsWithDelta(40, (float) session('allowance_remaining'), 0.001);
    }
}
