<?php

namespace App\Support;

use App\Models\AllowancePeriod;
use App\Models\AllowanceTransaction;
use App\Models\Order;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * The allowance domain: periods, their configured value, and the balance.
 *
 * Periods are opened lazily on first use rather than by a scheduled job —
 * this app has no scheduler or queue worker running.
 */
class Allowance
{
    /**
     * "Now" on the business clock, not the server's UTC clock.
     */
    public static function today(): CarbonImmutable
    {
        return CarbonImmutable::now(config('allowance.timezone'));
    }

    public static function configuredAmount(): float
    {
        return round((float) config('allowance.monthly_amount'), 2);
    }

    /**
     * The employee's period covering the given date, opening it if this is the
     * first time that month has been touched.
     *
     * Only ever opens a period for the CURRENT month: back-filling an old month
     * on demand would invent history, and opening a future one would let
     * somebody spend next month's money today.
     */
    public static function periodFor(User $user, ?CarbonInterface $date = null, bool $create = true): ?AllowancePeriod
    {
        $date = CarbonImmutable::parse($date ?? self::today())->setTimezone(config('allowance.timezone'));

        $existing = $user->allowancePeriods()->covering($date)->first();

        if ($existing !== null || ! $create) {
            return $existing;
        }

        if (! $date->isSameMonth(self::today())) {
            return null;
        }

        return self::open($user, $date);
    }

    /**
     * The period an employee can spend from right now, or null if they have
     * none (which includes not being eligible).
     */
    public static function currentPeriodFor(User $user): ?AllowancePeriod
    {
        if (! $user->canRedeemAllowance()) {
            return null;
        }

        return self::periodFor($user);
    }

    /**
     * Open a period for the month containing $date, stamped with the amount
     * configured today.
     */
    private static function open(User $user, CarbonImmutable $date): AllowancePeriod
    {
        $attributes = [
            'user_id' => $user->id,
            'starts_on' => $date->startOfMonth()->toDateString(),
            'ends_on' => $date->endOfMonth()->toDateString(),
        ];

        try {
            return AllowancePeriod::create($attributes + ['amount' => self::configuredAmount()]);
        } catch (UniqueConstraintViolationException) {
            // Two tills opened the same month at once; the unique index picked
            // a winner, so use theirs.
            return AllowancePeriod::where($attributes)->sole();
        }
    }

    /**
     * A snapshot of what the POS needs to decide whether to accept a payment.
     *
     * @return array{period: ?AllowancePeriod, label: ?string, amount: float, used: float, remaining: float}
     */
    public static function balanceFor(User $user): array
    {
        $period = self::currentPeriodFor($user);

        if ($period === null) {
            return ['period' => null, 'label' => null, 'amount' => 0.0, 'used' => 0.0, 'remaining' => 0.0];
        }

        return [
            'period' => $period,
            'label' => $period->label,
            'amount' => round((float) $period->amount, 2),
            'used' => $period->used(),
            'remaining' => $period->remaining(),
        ];
    }

    /**
     * Every period the employee has ever had, newest first. Historical periods
     * are never removed or recalculated.
     *
     * @return Collection<int, AllowancePeriod>
     */
    public static function historyFor(User $user): Collection
    {
        return $user->allowancePeriods()->orderByDesc('starts_on')->get();
    }

    /**
     * Spend against the employee's current period.
     *
     * Returns the ledger row, or null when the period is missing or the amount
     * would overdraw it. SQLite gives no usable row lock, so the balance is
     * re-read inside the transaction and the write is refused if the money is
     * no longer there.
     */
    public static function redeem(User $user, float $amount, ?Order $order = null, ?User $actor = null): ?AllowanceTransaction
    {
        $amount = round($amount, 2);

        if ($amount <= 0) {
            return null;
        }

        return DB::transaction(function () use ($user, $amount, $order, $actor) {
            $period = self::currentPeriodFor($user);

            if ($period === null) {
                return null;
            }

            // Re-read inside the transaction: another till may have spent since
            // the cashier's screen was drawn.
            $period->refresh();

            if ($period->remaining() + 0.0001 < $amount) {
                return null;
            }

            return AllowanceTransaction::create([
                'allowance_period_id' => $period->id,
                'user_id' => $user->id,
                'order_id' => $order?->id,
                'amount' => -$amount,
                'type' => AllowanceTransaction::TYPE_REDEMPTION,
                'description' => $order?->order_number,
                'recorded_by' => $actor?->id,
            ]);
        });
    }

    /**
     * Put money back, e.g. when an order is voided. Booked against the period
     * the original spend belongs to, not today's.
     */
    public static function refund(AllowanceTransaction $original, ?User $actor = null, ?string $reason = null): AllowanceTransaction
    {
        return AllowanceTransaction::create([
            'allowance_period_id' => $original->allowance_period_id,
            'user_id' => $original->user_id,
            'order_id' => $original->order_id,
            'amount' => abs((float) $original->amount),
            'type' => AllowanceTransaction::TYPE_REFUND,
            'description' => $reason ?? 'Reversal of transaction #'.$original->id,
            'recorded_by' => $actor?->id,
        ]);
    }
}
