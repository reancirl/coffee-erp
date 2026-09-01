<?php

namespace Tests\Feature\Pos;

use App\Enums\PaymentMethod;
use App\Models\Order;
use App\Models\User;
use App\Support\Allowance;
use App\Support\EmployeeQr;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Task 11.1 — the order slip has to name the payment method, and an allowance
 * sale has to name the employee it was drawn from and what they have left.
 *
 * The slip itself is built in the browser, so what is covered here is the
 * contract it is built from: the payload the POS gets back after a sale.
 */
class ReceiptPaymentTest extends TestCase
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

    /** @return array<string, mixed> */
    private function payload(string $method, float $price, array $overrides = []): array
    {
        return array_merge([
            'payment_method' => $method,
            'order_type' => 'dine-in',
            'items' => [[
                'product_id' => 1,
                'product_name' => 'Coffee',
                'quantity' => 1,
                'price' => $price,
            ]],
        ], $overrides);
    }

    private function sell(array $payload)
    {
        return $this->actingAs($this->cashier)->from('/pos')->post('/orders', $payload);
    }

    public function test_the_slip_can_name_the_order_it_was_printed_for(): void
    {
        $this->sell($this->payload(PaymentMethod::Cash->value, 120))
            ->assertSessionHasNoErrors()
            ->assertSessionHas('order_number', Order::sole()->order_number);
    }

    public function test_an_allowance_sale_returns_the_balance_left_after_it(): void
    {
        // 1,000 configured, 250 spent, so the slip should print 750.
        $this->sell($this->payload(
            PaymentMethod::EmployeeAllowance->value,
            250,
            ['employee_qr_token' => $this->token],
        ))->assertSessionHasNoErrors();

        $this->assertEqualsWithDelta(
            750,
            (float) session('allowance_remaining'),
            0.001,
        );
    }

    public function test_the_balance_comes_from_the_ledger_not_from_the_sale_amount(): void
    {
        // Something else moved the balance between the scan and the sale.
        Allowance::adjust($this->juan, -100, $this->cashier, 'Correction');

        $this->sell($this->payload(
            PaymentMethod::EmployeeAllowance->value,
            250,
            ['employee_qr_token' => $this->token],
        ))->assertSessionHasNoErrors();

        // 1,000 - 100 adjustment - 250 sale. A terminal doing its own
        // arithmetic from the scan would have printed 750.
        $this->assertEqualsWithDelta(650, (float) session('allowance_remaining'), 0.001);
        $this->assertEqualsWithDelta(
            650,
            Allowance::balanceFor($this->juan)['remaining'],
            0.001,
        );
    }

    public function test_a_non_allowance_sale_carries_no_balance_to_print(): void
    {
        $this->sell($this->payload(PaymentMethod::Cash->value, 120))
            ->assertSessionHasNoErrors()
            ->assertSessionMissing('allowance_remaining');
    }

    public function test_the_pos_screen_actually_receives_what_the_slip_needs(): void
    {
        // Flashing it is only half the job: nothing shared it with Inertia
        // before, so the slip was printing "N/A" for the order number.
        $this->actingAs($this->cashier)
            ->from('/pos')
            ->followingRedirects()
            ->post('/orders', $this->payload(
                PaymentMethod::EmployeeAllowance->value,
                250,
                ['employee_qr_token' => $this->token],
            ))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('flash.order_number', Order::sole()->order_number)
                ->where('flash.allowance_remaining', 750)
            );
    }

    public function test_a_rejected_allowance_sale_prints_nothing(): void
    {
        // More than the whole monthly allowance.
        $this->sell($this->payload(
            PaymentMethod::EmployeeAllowance->value,
            5000,
            ['employee_qr_token' => $this->token],
        ))->assertSessionHasErrors('payment');

        $this->assertNull(session('allowance_remaining'));
        $this->assertNull(session('order_number'));
    }
}
