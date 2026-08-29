<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * An employee's scannable credential.
 *
 * The token is a random opaque string. It intentionally encodes nothing about
 * the person or their money — it is only a lookup key for this row.
 */
class EmployeeQrCredential extends Model
{
    /**
     * Marks the value as one of ours, so a scanner can reject a product
     * barcode without a database round trip. The prefix is constant and
     * therefore leaks nothing about the holder.
     */
    public const PREFIX = 'SWQR-';

    /** Random characters after the prefix. 40 alphanumerics ≈ 238 bits. */
    private const TOKEN_LENGTH = 40;

    protected $fillable = [
        'user_id',
        'token',
        'issued_at',
        'issued_by',
        'revoked_at',
        'revoked_by',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function issuedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function revokedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'revoked_by');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('revoked_at');
    }

    public function isActive(): bool
    {
        return $this->revoked_at === null;
    }

    public function isRevoked(): bool
    {
        return ! $this->isActive();
    }

    /**
     * A fresh, unguessable token. Str::random draws from a CSPRNG.
     */
    public static function generateToken(): string
    {
        return self::PREFIX.Str::random(self::TOKEN_LENGTH);
    }

    public static function looksLikeToken(string $value): bool
    {
        return str_starts_with($value, self::PREFIX);
    }
}
