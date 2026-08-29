<?php

namespace Tests\Feature\Pos;

use App\Enums\EmploymentStatus;
use App\Enums\PaymentMethod;
use App\Models\Order;
use App\Models\User;
use App\Support\EmployeeQr;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Task 3.2 — the QR result is never trusted on its own.
 */
class AllowanceScanTest extends TestCase
{
    use RefreshDatabase;

    private function cashier(): User
    {
        return User::factory()->create(['name' => 'Maria']);
    }

    private function employee(array $overrides = []): User
    {
        $user = User::factory()->create(array_merge([
            'name' => 'Juan Dela Cruz',
            'position' => 'Developer',
            'allowance_eligible' => true,
        ], $overrides));

        $user->assignEmployeeCode();

        return $user->refresh();
    }

    /** @return array<string, mixed> */
    private function orderPayload(array $overrides = []): array
    {
        return array_merge([
            'payment_method' => PaymentMethod::EmployeeAllowance->value,
            'order_type' => 'dine-in',
            'items' => [[
                'product_id' => 1,
                'product_name' => 'Coffee',
                'quantity' => 1,
                'price' => 150,
            ]],
        ], $overrides);
    }

    // ---------- the scan lookup endpoint ----------

    public function test_scanning_a_valid_qr_identifies_the_employee(): void
    {
        $juan = $this->employee();
        $token = EmployeeQr::issueFor($juan)->token;

        $this->actingAs($this->cashier())
            ->postJson('/pos/scan-employee-qr', ['token' => $token])
            ->assertOk()
            ->assertJson([
                'ok' => true,
                'employee' => [
                    'name' => 'Juan Dela Cruz',
                    'employee_code' => 'SW-001',
                ],
            ]);
    }

    /**
     * Phase 4 changed this deliberately: the cashier now needs the remaining
     * balance on screen. What must still never carry it is the QR itself —
     * the balance is looked up server-side from the ledger.
     */
    public function test_scan_returns_the_balance_but_the_token_never_encodes_it(): void
    {
        $juan = $this->employee();
        $token = EmployeeQr::issueFor($juan)->token;

        $this->actingAs($this->cashier())
            ->postJson('/pos/scan-employee-qr', ['token' => $token])
            ->assertOk()
            ->assertJsonPath('allowance.amount', 1000)
            ->assertJsonPath('allowance.used', 0)
            ->assertJsonPath('allowance.remaining', 1000);

        // The scanned value itself is still opaque.
        foreach (['balance', 'remaining', '1000'] as $forbidden) {
            $this->assertStringNotContainsString($forbidden, strtolower($token));
        }
    }

    public function test_a_fake_token_is_rejected_with_employee_not_found(): void
    {
        $this->actingAs($this->cashier())
            ->postJson('/pos/scan-employee-qr', ['token' => 'UNKNOWN-TOKEN'])
            ->assertStatus(422)
            ->assertJson([
                'ok' => false,
                'resolution' => 'unknown',
                'message' => 'Employee not found.',
            ]);
    }

    public function test_a_revoked_token_is_rejected(): void
    {
        $juan = $this->employee();
        $token = EmployeeQr::issueFor($juan)->token;
        EmployeeQr::revokeFor($juan);

        $this->actingAs($this->cashier())
            ->postJson('/pos/scan-employee-qr', ['token' => $token])
            ->assertStatus(422)
            ->assertJson(['ok' => false, 'resolution' => 'revoked']);
    }

    public function test_an_inactive_employee_is_rejected(): void
    {
        $juan = $this->employee();
        $token = EmployeeQr::issueFor($juan)->token;
        $juan->update(['employment_status' => EmploymentStatus::Inactive]);

        $this->actingAs($this->cashier())
            ->postJson('/pos/scan-employee-qr', ['token' => $token])
            ->assertStatus(422)
            ->assertJson([
                'ok' => false,
                'resolution' => 'not_eligible',
                'message' => 'This employee is not active.',
            ]);
    }

    public function test_an_ineligible_employee_is_rejected(): void
    {
        $juan = $this->employee();
        $token = EmployeeQr::issueFor($juan)->token;
        $juan->update(['allowance_eligible' => false]);

        $this->actingAs($this->cashier())
            ->postJson('/pos/scan-employee-qr', ['token' => $token])
            ->assertStatus(422)
            ->assertJson(['ok' => false, 'resolution' => 'not_eligible']);
    }

    public function test_the_scan_endpoint_requires_a_token(): void
    {
        $this->actingAs($this->cashier())
            ->postJson('/pos/scan-employee-qr', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('token');
    }

    public function test_guests_cannot_resolve_tokens(): void
    {
        $juan = $this->employee();
        $token = EmployeeQr::issueFor($juan)->token;

        $this->postJson('/pos/scan-employee-qr', ['token' => $token])->assertUnauthorized();
    }

    // ---------- payment is rejected, not just the lookup ----------

    public function test_allowance_payment_without_a_token_is_rejected(): void
    {
        $this->actingAs($this->cashier())
            ->from('/pos')
            ->post('/orders', $this->orderPayload())
            ->assertSessionHasErrors('payment');

        $this->assertSame(0, Order::count());
    }

    public function test_allowance_payment_with_a_fake_token_is_rejected(): void
    {
        $this->actingAs($this->cashier())
            ->from('/pos')
            ->post('/orders', $this->orderPayload(['employee_qr_token' => 'UNKNOWN-TOKEN']))
            ->assertSessionHasErrors('payment');

        $this->assertSame(0, Order::count());
    }

    public function test_allowance_payment_with_a_revoked_token_is_rejected(): void
    {
        $juan = $this->employee();
        $token = EmployeeQr::issueFor($juan)->token;
        EmployeeQr::revokeFor($juan);

        $this->actingAs($this->cashier())
            ->from('/pos')
            ->post('/orders', $this->orderPayload(['employee_qr_token' => $token]))
            ->assertSessionHasErrors('payment');

        $this->assertSame(0, Order::count());
    }

    public function test_payment_is_rejected_if_eligibility_is_revoked_between_scan_and_pay(): void
    {
        $juan = $this->employee();
        $token = EmployeeQr::issueFor($juan)->token;

        // Cashier scans successfully...
        $this->actingAs($this->cashier())
            ->postJson('/pos/scan-employee-qr', ['token' => $token])
            ->assertOk();

        // ...then HR deactivates Juan before the order is submitted.
        $juan->update(['employment_status' => EmploymentStatus::Inactive]);

        $this->actingAs($this->cashier())
            ->from('/pos')
            ->post('/orders', $this->orderPayload(['employee_qr_token' => $token]))
            ->assertSessionHasErrors('payment');

        $this->assertSame(0, Order::count());
    }

    public function test_a_successful_allowance_order_records_the_employee(): void
    {
        $juan = $this->employee();
        $token = EmployeeQr::issueFor($juan)->token;

        $this->actingAs($this->cashier())
            ->post('/orders', $this->orderPayload(['employee_qr_token' => $token]))
            ->assertSessionHasNoErrors();

        $order = Order::sole();
        $this->assertSame($juan->id, $order->allowance_user_id);
        $this->assertEquals(150, $order->total);
    }

    public function test_non_allowance_orders_do_not_record_an_employee(): void
    {
        $this->actingAs($this->cashier())
            ->post('/orders', $this->orderPayload(['payment_method' => PaymentMethod::Cash->value]))
            ->assertSessionHasNoErrors();

        $this->assertNull(Order::sole()->allowance_user_id);
    }

    public function test_a_stray_token_on_a_cash_order_is_ignored(): void
    {
        $juan = $this->employee();
        $token = EmployeeQr::issueFor($juan)->token;

        $this->actingAs($this->cashier())
            ->post('/orders', $this->orderPayload([
                'payment_method' => PaymentMethod::Cash->value,
                'employee_qr_token' => $token,
            ]))
            ->assertSessionHasNoErrors();

        $this->assertNull(Order::sole()->allowance_user_id);
    }
}
