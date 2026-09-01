<?php

namespace App\Enums;

/**
 * Whether a user is currently employed and working.
 *
 * Only Active staff may redeem an allowance; everything else is a hard stop.
 */
enum EmploymentStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';

    public function isActive(): bool
    {
        return $this === self::Active;
    }

    public function label(): string
    {
        return ucfirst($this->value);
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
