<?php

namespace Tests\Feature\Employees;

use App\Enums\EmploymentStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The admin screen that backs the Task 1.1 scenario.
 */
class EmployeeAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_directory_lists_real_users_with_their_eligibility(): void
    {
        $admin = User::factory()->create(['name' => 'Admin']);
        $juan = User::factory()->create([
            'name' => 'Juan Dela Cruz',
            'position' => 'Developer',
            'allowance_eligible' => true,
        ]);
        $juan->assignEmployeeCode();

        User::factory()->create(['name' => 'Pedro Santos', 'position' => 'Manager']);

        $this->actingAs($admin)
            ->get('/employees')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('employees/index')
                ->where('employees.meta.total', 3)
                ->where('employees.data.1.name', 'Juan Dela Cruz')
                ->where('employees.data.1.employee_code', 'SW-001')
                ->where('employees.data.1.position', 'Developer')
                ->where('employees.data.1.can_redeem_allowance', true)
                ->where('employees.data.2.name', 'Pedro Santos')
                ->where('employees.data.2.can_redeem_allowance', false)
                ->where('employees.data.2.ineligibility_reason', 'This employee is not eligible for the coffee allowance.')
            );
    }

    public function test_marking_a_user_eligible_issues_a_code(): void
    {
        $admin = User::factory()->create();
        $juan = User::factory()->create(['name' => 'Juan Dela Cruz']);

        $this->actingAs($admin)
            ->patch("/employees/{$juan->id}", [
                'position' => 'Developer',
                'employment_status' => 'active',
                'allowance_eligible' => true,
            ])
            ->assertSessionHasNoErrors();

        $juan->refresh();
        $this->assertSame('SW-001', $juan->employee_code);
        $this->assertSame('Developer', $juan->position);
        $this->assertTrue($juan->canRedeemAllowance());
    }

    public function test_revoking_eligibility_blocks_redemption_but_keeps_the_code(): void
    {
        $admin = User::factory()->create();
        $juan = User::factory()->create(['allowance_eligible' => true]);
        $juan->assignEmployeeCode();

        $this->actingAs($admin)
            ->patch("/employees/{$juan->id}", [
                'employment_status' => 'active',
                'allowance_eligible' => false,
            ])
            ->assertSessionHasNoErrors();

        $juan->refresh();
        $this->assertSame('SW-001', $juan->employee_code);
        $this->assertFalse($juan->canRedeemAllowance());
    }

    public function test_deactivating_a_user_blocks_redemption(): void
    {
        $admin = User::factory()->create();
        $juan = User::factory()->create(['allowance_eligible' => true]);
        $juan->assignEmployeeCode();

        $this->actingAs($admin)
            ->patch("/employees/{$juan->id}", [
                'employment_status' => 'inactive',
                'allowance_eligible' => true,
            ])
            ->assertSessionHasNoErrors();

        $this->assertFalse($juan->refresh()->canRedeemAllowance());
        $this->assertSame(EmploymentStatus::Inactive, $juan->employment_status);
    }

    public function test_employee_code_cannot_be_set_through_the_endpoint(): void
    {
        $admin = User::factory()->create();
        $juan = User::factory()->create(['allowance_eligible' => true]);
        $juan->assignEmployeeCode();

        $this->actingAs($admin)
            ->patch("/employees/{$juan->id}", [
                'employment_status' => 'active',
                'allowance_eligible' => true,
                'employee_code' => 'SW-777',
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame('SW-001', $juan->refresh()->employee_code);
    }

    public function test_invalid_employment_status_is_rejected(): void
    {
        $admin = User::factory()->create();
        $juan = User::factory()->create();

        $this->actingAs($admin)
            ->from('/employees')
            ->patch("/employees/{$juan->id}", [
                'employment_status' => 'retired',
                'allowance_eligible' => true,
            ])
            ->assertSessionHasErrors('employment_status');

        $this->assertNull($juan->refresh()->employee_code);
    }

    public function test_eligible_only_filter_narrows_the_directory(): void
    {
        $admin = User::factory()->create();
        $juan = User::factory()->create(['name' => 'Juan', 'allowance_eligible' => true]);
        $juan->assignEmployeeCode();
        User::factory()->create(['name' => 'Pedro']);

        $this->actingAs($admin)
            ->get('/employees?eligible_only=1')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('employees.meta.total', 1)
                ->where('employees.data.0.name', 'Juan')
            );
    }

    public function test_guests_cannot_view_the_directory(): void
    {
        $this->get('/employees')->assertRedirect('/login');
    }
}
