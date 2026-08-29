<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * An employee's allowance for one calendar month.
 */
class AllowancePeriod extends Model
{
    protected $fillable = [
        'user_id',
        'starts_on',
        'ends_on',
        'amount',
    ];

    protected $casts = [
        'starts_on' => 'date',
        'ends_on' => 'date',
        'amount' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(AllowanceTransaction::class);
    }

    /**
     * Total spent so far, as a positive number.
     *
     * Spends are stored negative and refunds positive, so the net movement is
     * negated to read as "used".
     */
    public function used(): float
    {
        $used = round(-1 * (float) $this->transactions()->sum('amount'), 2);

        // Negating a zero sum yields -0.0, which formats as "-₱0.00" on the
        // cashier's screen. Normalise it back to a plain zero.
        return $used == 0.0 ? 0.0 : $used;
    }

    public function remaining(): float
    {
        return round((float) $this->amount - $this->used(), 2);
    }

    public function covers(CarbonInterface $date): bool
    {
        return $date->betweenIncluded($this->starts_on->startOfDay(), $this->ends_on->endOfDay());
    }

    /** Periods containing the given date. */
    public function scopeCovering(Builder $query, CarbonInterface $date): Builder
    {
        return $query->whereDate('starts_on', '<=', $date->toDateString())
            ->whereDate('ends_on', '>=', $date->toDateString());
    }

    /** Human label, e.g. "August 2026". */
    public function getLabelAttribute(): string
    {
        return $this->starts_on->format('F Y');
    }
}
