<?php

namespace Tests\Feature\Pos;

use App\Enums\PaymentMethod;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Task 0.1 — the existing POS payment flow keeps working, and a new payment
 * method can be introduced without a second order pipeline.
 * Task 0.3 — every new POS transaction records the authenticated cashier.
 */
class PaymentMethodFlowTest extends TestCase
{
    use RefreshDatabase;

    private function cashier(): User
    {
        return User::factory()->create(['name' => 'Maria']);
    }

    /** @return array<string, mixed> */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'payment_method' => PaymentMethod::Cash->value,
            'order_type' => 'dine-in',
            'items' => [[
                'product_id' => 1,
                'product_name' => 'Coffee',
                'quantity' => 1,
                'price' => 150,
            ]],
        ], $overrides);
    }

    public function test_cash_payment_still_works(): void
    {
        $this->actingAs($this->cashier())
            ->post('/orders', $this->payload())
            ->assertSessionHasNoErrors();

        $order = Order::sole();
        $this->assertSame(PaymentMethod::Cash->value, $order->payment_method);
        $this->assertEquals(150, $order->total);
    }

    public function test_gcash_payment_still_works(): void
    {
        $this->actingAs($this->cashier())
            ->post('/orders', $this->payload(['payment_method' => PaymentMethod::GCash->value]))
            ->assertSessionHasNoErrors();

        $this->assertSame(PaymentMethod::GCash->value, Order::sole()->payment_method);
    }

    public function test_split_payment_still_works(): void
    {
        $this->actingAs($this->cashier())
            ->post('/orders', $this->payload([
                'payment_method' => PaymentMethod::Split->value,
                'split_cash_amount' => 100,
                'split_gcash_amount' => 50,
            ]))
            ->assertSessionHasNoErrors();

        $order = Order::sole();
        $this->assertSame(PaymentMethod::Split->value, $order->payment_method);
        $this->assertEquals(100, $order->split_cash_amount);
        $this->assertEquals(50, $order->split_gcash_amount);
    }

    public function test_split_amounts_must_equal_the_order_total(): void
    {
        $this->actingAs($this->cashier())
            ->from('/pos')
            ->post('/orders', $this->payload([
                'payment_method' => PaymentMethod::Split->value,
                'split_cash_amount' => 100,
                'split_gcash_amount' => 10,
            ]))
            ->assertSessionHasErrors('payment');

        $this->assertSame(0, Order::count());
    }

    /**
     * Phase 3 tightened this: the method alone is no longer enough, a valid
     * employee QR must accompany it.
     */
    public function test_employee_allowance_is_accepted_with_a_valid_employee_qr(): void
    {
        $employee = \App\Models\User::factory()->create(['allowance_eligible' => true]);
        $this->grantAllowanceRole($employee);
        $employee->assignEmployeeCode();
        $token = \App\Support\EmployeeQr::issueFor($employee)->token;

        $this->actingAs($this->cashier())
            ->post('/orders', $this->payload([
                'payment_method' => PaymentMethod::EmployeeAllowance->value,
                'employee_qr_token' => $token,
            ]))
            ->assertSessionHasNoErrors();

        $order = Order::sole();
        $this->assertSame(PaymentMethod::EmployeeAllowance->value, $order->payment_method);
        $this->assertEquals(150, $order->total);
        $this->assertSame($employee->id, $order->allowance_user_id);
    }

    public function test_unknown_payment_method_is_rejected_at_the_boundary(): void
    {
        $this->actingAs($this->cashier())
            ->from('/pos')
            ->post('/orders', $this->payload(['payment_method' => 'Crypto']))
            ->assertSessionHasErrors('payment_method');

        $this->assertSame(0, Order::count());
    }

    public function test_split_amounts_are_not_stored_for_non_split_methods(): void
    {
        $this->actingAs($this->cashier())
            ->post('/orders', $this->payload([
                'payment_method' => PaymentMethod::Cash->value,
                'split_cash_amount' => 100,
                'split_gcash_amount' => 50,
            ]))
            ->assertSessionHasNoErrors();

        $order = Order::sole();
        $this->assertNull($order->split_cash_amount);
        $this->assertNull($order->split_gcash_amount);
    }

    public function test_order_records_the_authenticated_cashier(): void
    {
        $cashier = $this->cashier();

        $this->actingAs($cashier)
            ->post('/orders', $this->payload())
            ->assertSessionHasNoErrors();

        $order = Order::sole();
        $this->assertSame($cashier->id, $order->user_id);
        $this->assertSame('Maria', $order->cashier->name);
    }

    public function test_employee_allowance_transaction_identifies_its_cashier_and_employee(): void
    {
        $cashier = $this->cashier();

        $employee = \App\Models\User::factory()->create(['name' => 'Juan Dela Cruz', 'allowance_eligible' => true]);
        $this->grantAllowanceRole($employee);
        $employee->assignEmployeeCode();
        $token = \App\Support\EmployeeQr::issueFor($employee)->token;

        $this->actingAs($cashier)
            ->post('/orders', $this->payload([
                'payment_method' => PaymentMethod::EmployeeAllowance->value,
                'employee_qr_token' => $token,
            ]))
            ->assertSessionHasNoErrors();

        $order = Order::sole()->load(['cashier', 'allowanceEmployee']);
        $this->assertSame(PaymentMethod::EmployeeAllowance->value, $order->payment_method);
        // Both sides of the dispute case are recorded.
        $this->assertSame('Maria', $order->cashier->name);
        $this->assertSame('Juan Dela Cruz', $order->allowanceEmployee->name);
        $this->assertSame('SW-001', $order->allowanceEmployee->employee_code);
    }

    public function test_guests_cannot_create_orders(): void
    {
        $this->post('/orders', $this->payload())->assertRedirect('/login');
        $this->assertSame(0, Order::count());
    }
}
