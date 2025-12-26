<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class CashRemittance extends Model
{
    protected $fillable = [
        'sales_monitoring_id',
        'destination',
        'method',
        'amount',
        'reference',
        'attachment_path',
        'notes',
        'status',
        'created_by',
        'confirmed_by',
        'confirmed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'confirmed_at' => 'datetime',
    ];

    protected $appends = [
        'attachment_url',
    ];

    public function salesMonitoring(): BelongsTo
    {
        return $this->belongsTo(SalesMonitoring::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    public function getAttachmentUrlAttribute(): ?string
    {
        if (!$this->attachment_path) {
            return null;
        }

        return Storage::disk('public')->url($this->attachment_path);
    }
}
