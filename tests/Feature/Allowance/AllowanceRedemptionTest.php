<?php

namespace Tests\Feature\Allowance;

use App\Enums\PaymentMethod;
use App\Models\AllowanceTransaction;
use App\Models\Order;
use App\Models\User;
use App\Support\Allowance;
use App\Support\EmployeeQr;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Task 5.1 — every redemption creates a traceable transaction.
 * Task 5.2 — redeem / reversal / adjustment.
 */
class AllowanceRedemptionTest extends TestCase
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
        $this->juan->assignEmployeeCode();
        $this->juan->refresh();
        $this->token = EmployeeQr::issueFor($this->juan)->token;
    }

    /** @return array<string, mixed> */
    private function payload(float $price = 150, array $overrides = []): array
    {
        return array_merge([
            'payment_method' => PaymentMethod::EmployeeAllowance->value,
            'employee_qr_token' => $this->token,
            'order_type' => 'dine-in',
            'items' => [[
                'product_id' => 1,
                'product_name' => 'Coffee',
                'quantity' => 1,
                'price' => $price,
            ]],
        ], $overrides);
    }

    private function buy(float $price = 150)
    {
        return $this->actingAs($this->cashier)->from('/pos')->post('/orders', $this->payload($price));
    }

    // ---------- Task 5.1 ----------

    public function test_a_redemption_creates_a_ledger_transaction(): void
    {
        $this->buy(150)->assertSessionHasNoErrors();

        $transaction = AllowanceTransaction::sole();
        $order = Order::sole();

        $this->assertSame(AllowanceTransaction::TYPE_REDEEM, $transaction->type);
        $this->assertEquals(-150, $transaction->amount);
        $this->assertSame($this->juan->id, $transaction->user_id);
        // References the period, the order and the cashier.
        $this->assertSame(Allowance::currentPeriodFor($this->juan)->id, $transaction->allowance_period_id);
        $this->assertSame($order->id, $transaction->order_id);
        $this->assertSame($this->cashier->id, $transaction->recorded_by);
        $this->assertNotNull($transaction->created_at);
    }

    public function test_the_running_balance_matches_the_transactions(): void
    {
        $this->buy(150)->assertSessionHasNoErrors();
        $this->buy(200)->assertSessionHasNoErrors();
        $this->buy(100)->assertSessionHasNoErrors();

        $balance = Allowance::balanceFor($this->juan);

        $this->assertSame(450.0, $balance['used']);
        $this->assertSame(550.0, $balance['remaining']);
        $this->assertSame(3, $this->juan->allowanceTransactions()->count());
    }

    public function test_an_order_beyond_the_remaining_balance_is_rejected_entirely(): void
    {
        Allowance::redeem($this->juan, 900);

        $this->buy(150)->assertSessionHasErrors('payment');

        // No order, and no ledger row: the whole thing rolled back.
        $this->assertSame(0, Order::count());
        $this->assertSame(1, $this->juan->allowanceTransactions()->count());
        $this->assertSame(100.0, Allowance::balanceFor($this->juan)['remaining']);
    }

    public function test_the_rejection_message_states_the_remaining_balance(): void
    {
        Allowance::redeem($this->juan, 900);

        $response = $this->buy(150);

        $errors = session('errors')->get('payment');
        $this->assertStringContainsString('100.00', $errors[0]);
        $this->assertStringContainsString('150.00', $errors[0]);
        $response->assertSessionHasErrors('payment');
    }

    public function test_spending_the_exact_remaining_balance_succeeds(): void
    {
        Allowance::redeem($this->juan, 850);

        $this->buy(150)->assertSessionHasNoErrors();

        $this->assertSame(0.0, Allowance::balanceFor($this->juan)['remaining']);
        $this->assertSame(1, Order::count());
    }

    public function test_no_order_can_exist_without_its_ledger_entry(): void
    {
        $this->buy(150)->assertSessionHasNoErrors();

        $order = Order::sole();
        $this->assertSame(1, AllowanceTransaction::where('order_id', $order->id)->count());
    }

    public function test_cash_orders_never_touch_the_ledger(): void
    {
        $this->actingAs($this->cashier)
            ->post('/orders', $this->payload(150, [
                'payment_method' => PaymentMethod::Cash->value,
                'employee_qr_token' => null,
            ]))
            ->assertSessionHasNoErrors();

        $this->assertSame(0, AllowanceTransaction::count());
        $this->assertSame(1000.0, Allowance::balanceFor($this->juan)['remaining']);
    }

    // ---------- Task 5.2: reversal ----------

    public function test_voiding_an_order_records_a_reversal_and_keeps_the_original(): void
    {
        $this->buy(150)->assertSessionHasNoErrors();
        $order = Order::sole();

        $this->actingAs($this->cashier)->patch("/orders/{$order->id}/void");

        $transactions = $this->juan->allowanceTransactions()->orderBy('id')->get();

        $this->assertCount(2, $transactions);
        $this->assertSame(AllowanceTransaction::TYPE_REDEEM, $transactions[0]->type);
        $this->assertEquals(-150, $transactions[0]->amount);
        $this->assertSame(AllowanceTransaction::TYPE_REVERSAL, $transactions[1]->type);
        $this->assertEquals(150, $transactions[1]->amount);

        $this->assertSame(1000.0, Allowance::balanceFor($this->juan)['remaining']);
        $this->assertSame('voided', $order->refresh()->status);
    }

    public function test_voiding_twice_does_not_refund_twice(): void
    {
        $this->buy(150)->assertSessionHasNoErrors();
        $order = Order::sole();

        $this->actingAs($this->cashier)->patch("/orders/{$order->id}/void");
        $this->actingAs($this->cashier)->patch("/orders/{$order->id}/void");

        $this->assertSame(1, AllowanceTransaction::where('type', AllowanceTransaction::TYPE_REVERSAL)->count());
        $this->assertSame(1000.0, Allowance::balanceFor($this->juan)['remaining']);
    }

    public function test_reversed_money_can_be_spent_again(): void
    {
        $this->buy(1000)->assertSessionHasNoErrors();
        $this->assertSame(0.0, Allowance::balanceFor($this->juan)['remaining']);

        $this->actingAs($this->cashier)->patch('/orders/'.Order::sole()->id.'/void');

        $this->buy(400)->assertSessionHasNoErrors();
        $this->assertSame(600.0, Allowance::balanceFor($this->juan)['remaining']);
    }

    public function test_voiding_a_cash_order_writes_no_reversal(): void
    {
        $this->actingAs($this->cashier)->post('/orders', $this->payload(150, [
            'payment_method' => PaymentMethod::Cash->value,
            'employee_qr_token' => null,
        ]));

        $this->actingAs($this->cashier)->patch('/orders/'.Order::sole()->id.'/void');

        $this->assertSame(0, AllowanceTransaction::count());
    }

    // ---------- Task 5.2: adjustment authorisation ----------

    public function test_an_authorised_user_can_post_an_adjustment(): void
    {
        Allowance::redeem($this->juan, 650);

        $this->actingAs($this->cashier) // super admin: null tenant_id
            ->post("/employees/{$this->juan->id}/allowance/adjust", [
                'amount' => -100,
                'reason' => 'Clawback for cancelled event',
            ])
            ->assertSessionHasNoErrors();

        $adjustment = AllowanceTransaction::where('type', AllowanceTransaction::TYPE_ADJUSTMENT)->sole();

        $this->assertEquals(-100, $adjustment->amount);
        $this->assertSame('Clawback for cancelled event', $adjustment->description);
        $this->assertSame($this->cashier->id, $adjustment->recorded_by);
        $this->assertSame(250.0, Allowance::balanceFor($this->juan)['remaining']);
    }

    public function test_an_unauthorised_user_cannot_post_an_adjustment(): void
    {
        // A tenant-scoped user is not a super admin, and has no explicit
        // 'adjust allowance' permission.
        $tenant = new \App\Models\Tenant();
        $tenant->name = 'Swiftly Cafe';
        $tenant->save();
        $plainStaff = User::factory()->create(['tenant_id' => $tenant->id]);

        $this->assertFalse($plainStaff->canAdjustAllowances());

        $this->actingAs($plainStaff)
            ->post("/employees/{$this->juan->id}/allowance/adjust", ['amount' => 500, 'reason' => 'free money'])
            ->assertForbidden();

        $this->assertSame(0, AllowanceTransaction::count());
    }

    public function test_an_adjustment_requires_a_reason_and_a_non_zero_amount(): void
    {
        $this->actingAs($this->cashier)->from('/employees')
            ->post("/employees/{$this->juan->id}/allowance/adjust", ['amount' => 0, 'reason' => 'x'])
            ->assertSessionHasErrors('amount');

        $this->actingAs($this->cashier)->from('/employees')
            ->post("/employees/{$this->juan->id}/allowance/adjust", ['amount' => 100])
            ->assertSessionHasErrors('reason');

        $this->assertSame(0, AllowanceTransaction::count());
    }

    // ---------- the audit view ----------

    public function test_the_ledger_endpoint_explains_the_balance(): void
    {
        $this->buy(150);
        $this->buy(200);
        $this->buy(100);

        $this->actingAs($this->cashier)
            ->getJson("/employees/{$this->juan->id}/allowance")
            ->assertOk()
            ->assertJsonPath('amount', 1000)
            ->assertJsonPath('used', 450)
            ->assertJsonPath('remaining', 550)
            ->assertJsonCount(3, 'transactions')
            ->assertJsonPath('transactions.0.signed_amount', '-100.00')
            ->assertJsonPath('can_adjust', true);
    }

    public function test_the_ledger_links_each_transaction_to_its_order(): void
    {
        $this->buy(150);
        $orderNumber = Order::sole()->order_number;

        $this->actingAs($this->cashier)
            ->getJson("/employees/{$this->juan->id}/allowance")
            ->assertOk()
            ->assertJsonPath('transactions.0.order_number', $orderNumber)
            ->assertJsonPath('transactions.0.type', 'redeem');
    }
}
