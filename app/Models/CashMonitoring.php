<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class CashMonitoring extends Model
{
    protected $fillable = [
        'monitoring_date',
        'opening_balance',
        'cash_sales',
        'gcash_sales',
        'split_cash_sales',
        'split_gcash_sales',
        'cash_in',
        'cash_out',
        'expected_balance',
        'actual_balance',
        'variance',
        'cash_in_notes',
        'cash_out_notes',
        'variance_notes',
        'status',
        'opened_by',
        'closed_by',
        'opened_at',
        'closed_at',
    ];

    protected $casts = [
        'monitoring_date' => 'date',
        'opening_balance' => 'decimal:2',
        'cash_sales' => 'decimal:2',
        'gcash_sales' => 'decimal:2',
        'split_cash_sales' => 'decimal:2',
        'split_gcash_sales' => 'decimal:2',
        'cash_in' => 'decimal:2',
        'cash_out' => 'decimal:2',
        'expected_balance' => 'decimal:2',
        'actual_balance' => 'decimal:2',
        'variance' => 'decimal:2',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function openedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by');
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function calculateExpectedBalance(): float
    {
        return $this->opening_balance + $this->cash_sales + $this->split_cash_sales + $this->cash_in - $this->cash_out;
    }

    public function calculateVariance(): float
    {
        if ($this->actual_balance === null) {
            return 0;
        }
        return $this->actual_balance - $this->calculateExpectedBalance();
    }

    public function getTotalSalesAttribute(): float
    {
        return $this->cash_sales + $this->gcash_sales + $this->split_cash_sales + $this->split_gcash_sales;
    }

    public function getTotalCashAttribute(): float
    {
        return $this->cash_sales + $this->split_cash_sales;
    }

    public function getTotalGcashAttribute(): float
    {
        return $this->gcash_sales + $this->split_gcash_sales;
    }
}
