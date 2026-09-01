<?php

namespace Tests\Feature\Employees;

use App\Enums\EmploymentStatus;
use App\Enums\QrResolution;
use App\Models\EmployeeQrCredential;
use App\Models\Order;
use App\Models\User;
use App\Support\EmployeeQr;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Task 2.1 — secure, opaque QR credential.
 * Task 2.2 — display and print.
 * Task 2.3 — regenerate / revoke.
 */
class EmployeeQrTest extends TestCase
{
    use RefreshDatabase;

    private function employee(array $overrides = []): User
    {
        $user = User::factory()->create(array_merge([
            'name' => 'Juan Dela Cruz',
            'position' => 'Developer',
            'employment_status' => EmploymentStatus::Active,
            'allowance_eligible' => true,
        ], $overrides));

        $this->grantAllowanceRole($user);
        $user->assignEmployeeCode();

        return $user->refresh();
    }

    // ---------- Task 2.1: token properties ----------

    public function test_every_employee_gets_a_unique_qr(): void
    {
        $tokens = collect(range(1, 5))
            ->map(fn () => EmployeeQr::issueFor($this->employee())->token);

        $this->assertCount(5, $tokens->unique());
    }

    public function test_token_is_opaque_and_leaks_nothing_about_the_holder(): void
    {
        $juan = $this->employee(['name' => 'Juan Dela Cruz']);
        $token = EmployeeQr::issueFor($juan)->token;

        $payload = strtolower($token);

        foreach (['juan', 'dela', 'cruz', 'sw-001', 'developer', $juan->email] as $secret) {
            $this->assertStringNotContainsString(strtolower($secret), $payload);
        }

        // No identifiers or amounts encoded either.
        $this->assertDoesNotMatchRegularExpression('/\b'.$juan->id.'\b/', $token);
        $this->assertStringNotContainsString('1000', $token);
        $this->assertStringNotContainsString('650', $token);
    }

    public function test_token_is_long_and_random(): void
    {
        $a = EmployeeQr::issueFor($this->employee())->token;
        $b = EmployeeQr::issueFor($this->employee())->token;

        $this->assertStringStartsWith(EmployeeQrCredential::PREFIX, $a);
        // Prefix plus 40 random characters.
        $this->assertSame(strlen(EmployeeQrCredential::PREFIX) + 40, strlen($a));
        $this->assertNotSame($a, $b);
    }

    public function test_tokens_are_unique_at_the_database_level(): void
    {
        $token = EmployeeQr::issueFor($this->employee())->token;

        $this->expectException(\Illuminate\Database\UniqueConstraintViolationException::class);

        EmployeeQrCredential::create([
            'user_id' => $this->employee()->id,
            'token' => $token,
            'issued_at' => now(),
        ]);
    }

    public function test_credential_row_stores_no_balance_fields(): void
    {
        $columns = \Illuminate\Support\Facades\Schema::getColumnListing('employee_qr_credentials');

        foreach (['balance', 'amount', 'allowance', 'remaining', 'limit'] as $forbidden) {
            $this->assertEmpty(
                array_filter($columns, fn ($c) => str_contains($c, $forbidden)),
                "employee_qr_credentials must not carry a '{$forbidden}' column"
            );
        }
    }

    // ---------- Task 2.1 / 2.3: admin issuing ----------

    public function test_admin_can_generate_a_qr(): void
    {
        $admin = User::factory()->create(['name' => 'Admin']);
        $juan = $this->employee();

        $this->actingAs($admin)
            ->post("/employees/{$juan->id}/qr")
            ->assertSessionHasNoErrors();

        $credential = $juan->activeQrCredential();
        $this->assertNotNull($credential);
        $this->assertSame($admin->id, $credential->issued_by);
    }

    public function test_ineligible_employee_cannot_be_issued_a_qr(): void
    {
        $admin = User::factory()->create();
        $pedro = User::factory()->create(['name' => 'Pedro Santos', 'allowance_eligible' => false]);

        $this->actingAs($admin)
            ->from('/employees')
            ->post("/employees/{$pedro->id}/qr")
            ->assertSessionHasErrors('qr');

        $this->assertNull($pedro->activeQrCredential());
    }

    // ---------- Task 2.2: display and print ----------

    public function test_qr_endpoint_returns_a_scannable_svg(): void
    {
        $admin = User::factory()->create();
        $juan = $this->employee();
        EmployeeQr::issueFor($juan);

        $response = $this->actingAs($admin)->get("/employees/{$juan->id}/qr");

        $response->assertOk()->assertHeader('Content-Type', 'image/svg+xml');
        $this->assertStringContainsString('<svg', $response->getContent());
    }

    public function test_qr_image_is_never_cached(): void
    {
        $admin = User::factory()->create();
        $juan = $this->employee();
        EmployeeQr::issueFor($juan);

        $this->actingAs($admin)
            ->get("/employees/{$juan->id}/qr")
            ->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_employee_can_view_their_own_qr_page_with_name_and_code(): void
    {
        $juan = $this->employee();
        EmployeeQr::issueFor($juan);

        $this->actingAs($juan)
            ->get('/coffee-allowance')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('coffee-allowance')
                ->where('employee.name', 'Juan Dela Cruz')
                ->where('employee.employee_code', 'SW-001')
                ->where('employee.eligible', true)
            );
    }

    public function test_self_service_page_never_exposes_the_raw_token(): void
    {
        $juan = $this->employee();
        $token = EmployeeQr::issueFor($juan)->token;

        $this->actingAs($juan)
            ->get('/coffee-allowance')
            ->assertOk()
            ->assertDontSee($token);
    }

    public function test_directory_never_exposes_the_raw_token(): void
    {
        $admin = User::factory()->create();
        $juan = $this->employee();
        $token = EmployeeQr::issueFor($juan)->token;

        $this->actingAs($admin)
            ->get('/employees')
            ->assertOk()
            ->assertDontSee($token);
    }

    public function test_self_service_image_only_ever_renders_your_own_qr(): void
    {
        $juan = $this->employee();
        EmployeeQr::issueFor($juan);

        $pedro = User::factory()->create(['name' => 'Pedro']);

        // Pedro has no credential, so his own endpoint 404s rather than
        // falling back to anybody else's.
        $this->actingAs($pedro)->get('/coffee-allowance/qr')->assertNotFound();
        $this->actingAs($juan)->get('/coffee-allowance/qr')->assertOk();
    }

    public function test_a_dev_lands_on_their_coffee_allowance_and_nothing_else(): void
    {
        $tenant = new \App\Models\Tenant();
        $tenant->name = 'Swiftly Cafe';
        $tenant->save();

        $juan = $this->employee(['tenant_id' => $tenant->id]);

        // The allowance role grants exactly one module.
        $this->assertSame(['coffee-allowance'], $juan->getAccessibleModules());
        $this->assertSame('/coffee-allowance', $juan->landingRoute());

        $this->actingAs($juan)->get('/coffee-allowance')->assertOk();

        // Everything else in the app stays shut.
        foreach (['/dashboard', '/pos', '/orders', '/employees'] as $path) {
            $this->actingAs($juan)->get($path)->assertForbidden();
        }
    }

    public function test_a_user_without_the_module_cannot_open_the_allowance_page(): void
    {
        $tenant = new \App\Models\Tenant();
        $tenant->name = 'Swiftly Cafe';
        $tenant->save();

        $pedro = User::factory()->create(['name' => 'Pedro Santos', 'tenant_id' => $tenant->id]);

        $this->actingAs($pedro)->get('/coffee-allowance')->assertForbidden();
        // And is not dumped onto a page they cannot open.
        $this->assertSame('/settings/profile', $pedro->landingRoute());
    }

    public function test_the_old_settings_url_still_redirects(): void
    {
        $juan = $this->employee();

        $this->actingAs($juan)
            ->get('/settings/coffee-qr')
            ->assertRedirect('/coffee-allowance');
    }

    public function test_a_user_with_dashboard_access_still_lands_on_the_dashboard(): void
    {
        $admin = User::factory()->create();

        $this->assertSame('/dashboard', $admin->landingRoute());
    }

    public function test_guests_cannot_reach_qr_endpoints(): void
    {
        $juan = $this->employee();
        EmployeeQr::issueFor($juan);

        $this->get("/employees/{$juan->id}/qr")->assertRedirect('/login');
        $this->get('/coffee-allowance/qr')->assertRedirect('/login');
    }

    // ---------- Task 2.3: revoke and regenerate ----------

    public function test_regenerating_invalidates_the_old_qr_and_the_new_one_works(): void
    {
        $juan = $this->employee();

        $old = EmployeeQr::issueFor($juan)->token;
        $new = EmployeeQr::issueFor($juan)->token;

        $this->assertNotSame($old, $new);

        $this->assertSame(QrResolution::Revoked, EmployeeQr::resolve($old)['resolution']);

        $resolved = EmployeeQr::resolve($new);
        $this->assertSame(QrResolution::Ok, $resolved['resolution']);
        $this->assertSame($juan->id, $resolved['user']->id);
    }

    public function test_revoking_leaves_no_active_credential(): void
    {
        $admin = User::factory()->create();
        $juan = $this->employee();
        $token = EmployeeQr::issueFor($juan)->token;

        $this->actingAs($admin)
            ->delete("/employees/{$juan->id}/qr")
            ->assertSessionHasNoErrors();

        $this->assertNull($juan->activeQrCredential());
        $this->assertSame(QrResolution::Revoked, EmployeeQr::resolve($token)['resolution']);
    }

    public function test_revocation_records_who_did_it_and_keeps_the_row(): void
    {
        $admin = User::factory()->create(['name' => 'Admin']);
        $juan = $this->employee();
        $credential = EmployeeQr::issueFor($juan);

        $this->actingAs($admin)->delete("/employees/{$juan->id}/qr");

        $credential->refresh();
        $this->assertNotNull($credential->revoked_at);
        $this->assertSame($admin->id, $credential->revoked_by);
        $this->assertDatabaseCount('employee_qr_credentials', 1);
    }

    public function test_revoking_a_qr_leaves_transaction_history_intact(): void
    {
        $juan = $this->employee();
        EmployeeQr::issueFor($juan);

        $order = Order::create([
            'user_id' => $juan->id,
            'subtotal' => 150, 'discount' => 0, 'total' => 150,
            'payment_method' => 'Employee Allowance',
            'payment_status' => 'completed', 'status' => 'completed',
        ]);

        EmployeeQr::revokeFor($juan);
        EmployeeQr::issueFor($juan);

        $order->refresh()->load('cashier');
        $this->assertSame($juan->id, $order->cashier->id);
        $this->assertSame('SW-001', $order->cashier->employee_code);
        $this->assertEquals(150, $order->total);
    }

    public function test_only_one_credential_is_active_at_a_time(): void
    {
        $juan = $this->employee();

        EmployeeQr::issueFor($juan);
        EmployeeQr::issueFor($juan);
        EmployeeQr::issueFor($juan);

        $this->assertSame(1, $juan->qrCredentials()->active()->count());
        $this->assertSame(3, $juan->qrCredentials()->count());
    }

    // ---------- resolution ----------

    public function test_unknown_token_is_rejected(): void
    {
        $result = EmployeeQr::resolve('SWQR-totally-made-up-value');

        $this->assertSame(QrResolution::Unknown, $result['resolution']);
        $this->assertNull($result['user']);
        $this->assertSame('Employee not found.', $result['message']);
    }

    public function test_valid_qr_for_a_deactivated_employee_is_refused(): void
    {
        $juan = $this->employee();
        $token = EmployeeQr::issueFor($juan)->token;

        $juan->update(['employment_status' => EmploymentStatus::Inactive]);

        $result = EmployeeQr::resolve($token);
        $this->assertSame(QrResolution::NotEligible, $result['resolution']);
        $this->assertSame('This employee is not active.', $result['message']);
    }

    public function test_valid_qr_for_a_revoked_eligibility_is_refused(): void
    {
        $juan = $this->employee();
        $token = EmployeeQr::issueFor($juan)->token;

        $juan->update(['allowance_eligible' => false]);

        $this->assertSame(QrResolution::NotEligible, EmployeeQr::resolve($token)['resolution']);
    }
}
