<?php

namespace Tests\Feature\Employees;

use App\Enums\EmploymentStatus;
use App\Models\Order;
use App\Models\User;
use App\Support\EmployeeCode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Task 1.1 — eligibility on the existing user architecture.
 * Task 1.2 — a unique, permanent employee identifier.
 */
class EmployeeIdentityTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create();
    }

    private function eligible(array $overrides = []): User
    {
        $user = User::factory()->create(array_merge([
            'employment_status' => EmploymentStatus::Active,
            'allowance_eligible' => true,
        ], $overrides));

        $user->assignEmployeeCode();

        return $user->refresh();
    }

    // ---------- Task 1.1: eligibility ----------

    public function test_an_active_eligible_employee_can_redeem(): void
    {
        $juan = $this->eligible(['name' => 'Juan Dela Cruz', 'position' => 'Developer']);

        $this->assertTrue($juan->canRedeemAllowance());
        $this->assertNull($juan->allowanceIneligibilityReason());
    }

    public function test_a_non_eligible_user_cannot_redeem(): void
    {
        $pedro = User::factory()->create([
            'name' => 'Pedro Santos',
            'position' => 'Manager',
            'employment_status' => EmploymentStatus::Active,
            'allowance_eligible' => false,
        ]);

        $this->assertFalse($pedro->canRedeemAllowance());
        $this->assertSame('This employee is not eligible for the coffee allowance.', $pedro->allowanceIneligibilityReason());
    }

    public function test_an_inactive_user_cannot_redeem_even_if_marked_eligible(): void
    {
        $user = $this->eligible();
        $user->update(['employment_status' => EmploymentStatus::Inactive]);

        $this->assertFalse($user->fresh()->canRedeemAllowance());
        $this->assertSame('This employee is not active.', $user->fresh()->allowanceIneligibilityReason());
    }

    public function test_an_eligible_user_without_a_code_cannot_redeem(): void
    {
        $user = User::factory()->create([
            'employment_status' => EmploymentStatus::Active,
            'allowance_eligible' => true,
        ]);

        $this->assertNull($user->employee_code);
        $this->assertFalse($user->canRedeemAllowance());
        $this->assertSame('This employee has no employee code.', $user->allowanceIneligibilityReason());
    }

    public function test_users_default_to_ineligible(): void
    {
        $user = User::factory()->create();

        $this->assertFalse($user->allowance_eligible);
        $this->assertTrue($user->isActive());
        $this->assertFalse($user->canRedeemAllowance());
    }

    public function test_eligibility_is_independent_of_roles_and_permissions(): void
    {
        // A super admin (null tenant) has every module permission but no allowance.
        $superAdmin = User::factory()->create(['tenant_id' => null]);

        $this->assertTrue($superAdmin->hasModuleAccess('pos'));
        $this->assertFalse($superAdmin->canRedeemAllowance());
    }

    public function test_the_eligible_scope_returns_only_redeemable_users(): void
    {
        $redeemable = $this->eligible();
        $this->eligible()->update(['employment_status' => EmploymentStatus::Inactive]);
        User::factory()->create(['allowance_eligible' => false]);

        $this->assertSame([$redeemable->id], User::allowanceEligible()->pluck('id')->all());
    }

    // ---------- Task 1.2: identifier ----------

    public function test_codes_are_issued_in_sequence(): void
    {
        $this->assertSame('SW-001', $this->eligible()->employee_code);
        $this->assertSame('SW-002', $this->eligible()->employee_code);
        $this->assertSame('SW-003', $this->eligible()->employee_code);
    }

    public function test_a_code_cannot_be_duplicated(): void
    {
        $first = $this->eligible();

        $this->expectException(\Illuminate\Database\UniqueConstraintViolationException::class);

        User::factory()->create()->forceFill(['employee_code' => $first->employee_code])->save();
    }

    public function test_assigning_a_code_twice_keeps_the_original(): void
    {
        $user = $this->eligible();
        $original = $user->employee_code;

        $this->assertSame($original, $user->assignEmployeeCode());
        $this->assertSame($original, $user->fresh()->employee_code);
    }

    public function test_the_code_is_not_mass_assignable(): void
    {
        // Factories run unguarded by design, so exercise the mass-assignment
        // path a request would actually take.
        $user = new User();
        $user->fill(['name' => 'Mallory', 'email' => 'm@example.com', 'employee_code' => 'SW-999']);

        $this->assertNull($user->employee_code);

        $existing = $this->eligible();
        $existing->fill(['employee_code' => 'SW-999']);
        $this->assertSame('SW-001', $existing->employee_code);
    }

    public function test_changing_employee_details_does_not_invalidate_past_transactions(): void
    {
        $juan = $this->eligible(['name' => 'Juan Dela Cruz', 'position' => 'Developer']);

        $order = Order::create([
            'user_id' => $juan->id,
            'subtotal' => 150, 'discount' => 0, 'total' => 150,
            'payment_method' => 'Cash', 'payment_status' => 'completed', 'status' => 'completed',
        ]);

        // Rename, reposition, deactivate and revoke eligibility.
        $juan->update([
            'name' => 'Juan D. Cruz',
            'position' => 'Senior Developer',
            'employment_status' => EmploymentStatus::Inactive,
            'allowance_eligible' => false,
        ]);

        // The transaction still resolves to the same person, because it is
        // linked by immutable id rather than by any mutable detail.
        $order->refresh()->load('cashier');
        $this->assertSame($juan->id, $order->cashier->id);
        $this->assertSame('Juan D. Cruz', $order->cashier->name);
        $this->assertSame('SW-001', $order->cashier->employee_code);
    }

    public function test_code_survives_eligibility_being_revoked(): void
    {
        $user = $this->eligible();

        $user->update(['allowance_eligible' => false]);

        $this->assertSame('SW-001', $user->fresh()->employee_code);
    }

    public function test_next_code_accounts_for_existing_codes(): void
    {
        $this->eligible();
        $this->eligible();

        $this->assertSame('SW-003', EmployeeCode::next());
    }
}
