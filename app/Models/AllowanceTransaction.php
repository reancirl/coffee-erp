<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One movement against an allowance period.
 *
 * Negative amounts are spends, positive are refunds or adjustments. Rows are
 * immutable: correcting a mistake means adding an offsetting row, never
 * editing the original.
 */
class AllowanceTransaction extends Model
{
    public const TYPE_REDEEM = 'redeem';
    public const TYPE_REVERSAL = 'reversal';
    public const TYPE_ADJUSTMENT = 'adjustment';

    /** @return array<int, string> */
    public static function types(): array
    {
        return [self::TYPE_REDEEM, self::TYPE_REVERSAL, self::TYPE_ADJUSTMENT];
    }

    public function isReversal(): bool
    {
        return $this->type === self::TYPE_REVERSAL;
    }

    /** Signed amount as a display string, e.g. "-150.00" / "+150.00". */
    public function getSignedAmountAttribute(): string
    {
        $amount = (float) $this->amount;

        return ($amount < 0 ? '-' : '+').number_format(abs($amount), 2);
    }

    protected $fillable = [
        'allowance_period_id',
        'user_id',
        'order_id',
        'amount',
        'type',
        'description',
        'recorded_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();

        // The ledger is append-only. Enforced here rather than left to
        // convention, because a silently edited row would make every balance
        // downstream of it wrong with no trace.
        static::updating(function () {
            throw new \LogicException('Allowance transactions are immutable; record an offsetting entry instead.');
        });

        static::deleting(function () {
            throw new \LogicException('Allowance transactions cannot be deleted; record an offsetting entry instead.');
        });
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(AllowancePeriod::class, 'allowance_period_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
