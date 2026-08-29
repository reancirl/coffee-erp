<?php

namespace Tests\Feature\Allowance;

use App\Models\AllowancePeriod;
use App\Models\AllowanceTransaction;
use App\Models\User;
use App\Support\Allowance;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Task 4.1 — allowance periods.
 * Task 4.2 — configurable amount.
 * Task 4.3 — determining the current allowance.
 */
class AllowancePeriodTest extends TestCase
{
    use RefreshDatabase;

    private function employee(array $overrides = []): User
    {
        $user = User::factory()->create(array_merge([
            'name' => 'Juan Dela Cruz',
            'allowance_eligible' => true,
        ], $overrides));

        $user->assignEmployeeCode();

        return $user->refresh();
    }

    /** Freeze the business clock at a known Manila date. */
    private function freezeAt(string $manilaDateTime): void
    {
        $this->travelTo(CarbonImmutable::parse($manilaDateTime, config('allowance.timezone'))->utc());
    }

    // ---------- Task 4.1: periods ----------

    public function test_a_period_belongs_to_an_employee_and_spans_the_month(): void
    {
        $this->freezeAt('2026-08-29 10:00');
        $juan = $this->employee();

        $period = Allowance::currentPeriodFor($juan);

        $this->assertSame($juan->id, $period->user_id);
        $this->assertSame('2026-08-01', $period->starts_on->toDateString());
        $this->assertSame('2026-08-31', $period->ends_on->toDateString());
        $this->assertSame('August 2026', $period->label);
    }

    public function test_the_same_period_is_reused_within_the_month(): void
    {
        $this->freezeAt('2026-08-01 08:00');
        $juan = $this->employee();
        $first = Allowance::currentPeriodFor($juan);

        $this->freezeAt('2026-08-29 20:00');
        $second = Allowance::currentPeriodFor($juan);

        $this->assertSame($first->id, $second->id);
        $this->assertSame(1, $juan->allowancePeriods()->count());
    }

    public function test_a_new_month_opens_a_new_period_and_the_old_one_survives(): void
    {
        $this->freezeAt('2026-08-29 10:00');
        $juan = $this->employee();
        $august = Allowance::currentPeriodFor($juan);
        Allowance::redeem($juan, 650);

        $this->freezeAt('2026-09-01 09:00');
        $september = Allowance::currentPeriodFor($juan);

        $this->assertNotSame($august->id, $september->id);
        $this->assertEquals(1000, $september->amount);
        $this->assertSame(1000.0, $september->remaining());

        // August is untouched and still readable.
        $august->refresh();
        $this->assertSame(650.0, $august->used());
        $this->assertSame(350.0, $august->remaining());
    }

    public function test_history_remains_accessible(): void
    {
        $juan = $this->employee();

        $this->freezeAt('2026-07-10 10:00');
        Allowance::currentPeriodFor($juan);
        $this->freezeAt('2026-08-10 10:00');
        Allowance::currentPeriodFor($juan);
        $this->freezeAt('2026-09-10 10:00');
        Allowance::currentPeriodFor($juan);

        $history = Allowance::historyFor($juan);

        $this->assertCount(3, $history);
        $this->assertSame(
            ['September 2026', 'August 2026', 'July 2026'],
            $history->map(fn ($p) => $p->label)->all()
        );
    }

    public function test_periods_cannot_overlap_for_the_same_employee(): void
    {
        $this->freezeAt('2026-08-29 10:00');
        $juan = $this->employee();
        Allowance::currentPeriodFor($juan);

        $this->expectException(\Illuminate\Database\UniqueConstraintViolationException::class);

        AllowancePeriod::create([
            'user_id' => $juan->id,
            'starts_on' => '2026-08-01',
            'ends_on' => '2026-08-31',
            'amount' => 1000,
        ]);
    }

    public function test_two_employees_have_independent_periods(): void
    {
        $this->freezeAt('2026-08-29 10:00');
        $juan = $this->employee();
        $maria = $this->employee(['name' => 'Maria']);

        Allowance::redeem($juan, 650);

        $this->assertSame(350.0, Allowance::balanceFor($juan)['remaining']);
        $this->assertSame(1000.0, Allowance::balanceFor($maria)['remaining']);
    }

    // ---------- Task 4.2: configurable amount ----------

    public function test_the_amount_comes_from_configuration(): void
    {
        config(['allowance.monthly_amount' => 1500]);
        $this->freezeAt('2026-08-29 10:00');

        $this->assertEquals(1500, Allowance::currentPeriodFor($this->employee())->amount);
    }

    public function test_changing_the_configuration_does_not_rewrite_existing_periods(): void
    {
        $this->freezeAt('2026-08-15 10:00');
        config(['allowance.monthly_amount' => 1000]);
        $juan = $this->employee();
        $august = Allowance::currentPeriodFor($juan);

        // Management raises the allowance mid-stream.
        config(['allowance.monthly_amount' => 1500]);

        $this->assertEquals(1000, $august->refresh()->amount);

        $this->freezeAt('2026-09-02 10:00');
        $september = Allowance::currentPeriodFor($juan);

        $this->assertEquals(1500, $september->amount);
        $this->assertEquals(1000, $august->refresh()->amount);
    }

    public function test_the_amount_is_not_hardcoded_anywhere_in_the_app(): void
    {
        // Guards against a stray literal creeping back into the domain.
        $sources = [
            file_get_contents(app_path('Support/Allowance.php')),
            file_get_contents(app_path('Models/AllowancePeriod.php')),
        ];

        foreach ($sources as $source) {
            $this->assertStringNotContainsString('1000', $source);
        }
    }

    // ---------- Task 4.3: current allowance ----------

    public function test_balance_reflects_usage(): void
    {
        $this->freezeAt('2026-08-29 10:00');
        $juan = $this->employee();

        Allowance::redeem($juan, 400);
        Allowance::redeem($juan, 250);

        $balance = Allowance::balanceFor($juan);

        $this->assertSame('August 2026', $balance['label']);
        $this->assertSame(1000.0, $balance['amount']);
        $this->assertSame(650.0, $balance['used']);
        $this->assertSame(350.0, $balance['remaining']);
    }

    public function test_an_expired_period_is_not_selected(): void
    {
        $this->freezeAt('2026-08-29 10:00');
        $juan = $this->employee();
        $august = Allowance::currentPeriodFor($juan);

        $this->freezeAt('2026-09-05 10:00');
        $current = Allowance::currentPeriodFor($juan);

        $this->assertNotSame($august->id, $current->id);
        $this->assertSame('September 2026', $current->label);
    }

    public function test_a_future_period_is_never_opened_on_demand(): void
    {
        $this->freezeAt('2026-08-29 10:00');
        $juan = $this->employee();

        $future = Allowance::periodFor($juan, CarbonImmutable::parse('2026-12-01'));

        $this->assertNull($future);
        $this->assertSame(0, $juan->allowancePeriods()->where('starts_on', '2026-12-01')->count());
    }

    public function test_a_past_month_is_not_back_filled(): void
    {
        $this->freezeAt('2026-08-29 10:00');
        $juan = $this->employee();

        $this->assertNull(Allowance::periodFor($juan, CarbonImmutable::parse('2026-06-15')));
        $this->assertSame(0, $juan->allowancePeriods()->count());
    }

    public function test_an_ineligible_employee_has_no_current_period(): void
    {
        $this->freezeAt('2026-08-29 10:00');
        $juan = $this->employee(['allowance_eligible' => false]);

        $this->assertNull(Allowance::currentPeriodFor($juan));
        $this->assertSame(0.0, Allowance::balanceFor($juan)['remaining']);
    }

    // ---------- month boundaries on the business clock ----------

    public function test_month_boundary_follows_manila_not_utc(): void
    {
        // 00:30 on 1 September in Manila is still 31 August in UTC.
        $this->freezeAt('2026-09-01 00:30');
        $juan = $this->employee();

        $this->assertSame('September 2026', Allowance::currentPeriodFor($juan)->label);
    }

    public function test_late_evening_on_the_last_day_still_uses_that_month(): void
    {
        $this->freezeAt('2026-08-31 23:30');
        $juan = $this->employee();

        $this->assertSame('August 2026', Allowance::currentPeriodFor($juan)->label);
    }
}
