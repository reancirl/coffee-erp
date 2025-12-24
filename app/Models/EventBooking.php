<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventBooking extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_RESERVED = 'reserved';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'event_package_id',
        'event_date',
        'event_start_time',
        'duration_minutes',
        'event_name',
        'event_type',
        'venue_address',
        'contact_name',
        'contact_email',
        'contact_phone',
        'expected_guests',
        'status',
        'notes',
    ];

    protected $casts = [
        'event_date' => 'date',
    ];

    public function package(): BelongsTo
    {
        return $this->belongsTo(EventPackage::class, 'event_package_id');
    }
}
