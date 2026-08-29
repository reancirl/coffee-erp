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
    public const TYPE_REDEMPTION = 'redemption';
    public const TYPE_REFUND = 'refund';
    public const TYPE_ADJUSTMENT = 'adjustment';

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
