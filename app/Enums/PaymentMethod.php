<?php

namespace App\Enums;

/**
 * The payment methods the POS is allowed to record.
 *
 * The backing value is the exact string persisted on `orders.payment_method`
 * and the exact label the POS sends, so existing rows keep resolving.
 */
enum PaymentMethod: string
{
    case Cash = 'Cash';
    case GCash = 'GCash';
    case Split = 'Split (Cash + GCash)';
    case EmployeeAllowance = 'Employee Allowance';

    /**
     * Resolve a persisted/submitted string, tolerating legacy spellings.
     */
    public static function tryFromLabel(?string $value): ?self
    {
        if ($value === null) {
            return null;
        }

        return self::tryFrom($value) ?? match ($value) {
            'G-Cash' => self::GCash, // legacy spelling accepted by older reporting code
            default => null,
        };
    }

    /**
     * Every value accepted on input, aliases included. Used for validation.
     *
     * @return array<int, string>
     */
    public static function acceptedValues(): array
    {
        return [...array_column(self::cases(), 'value'), 'G-Cash'];
    }

    /**
     * Does settling this method put physical cash in the drawer?
     *
     * Split is false here because only its cash *portion* reaches the drawer;
     * that portion is allocated separately by the PaymentBreakdown.
     */
    public function increasesCashDrawer(): bool
    {
        return $this === self::Cash;
    }

    /**
     * Is this method settled by something other than money taken at the till?
     * Employee Allowance draws down a pre-funded balance, so it is revenue
     * but never cash on hand.
     */
    public function isNonCash(): bool
    {
        return ! $this->increasesCashDrawer();
    }

    public function isSplit(): bool
    {
        return $this === self::Split;
    }

    public function label(): string
    {
        return $this->value;
    }
}
