<?php

namespace App\Enums;

/**
 * Outcome of scanning an employee QR.
 *
 * Distinguishing Revoked from Unknown lets the POS tell a cashier "that card
 * was cancelled — issue a new one" instead of a useless "not found".
 */
enum QrResolution: string
{
    case Ok = 'ok';
    case Unknown = 'unknown';
    case Revoked = 'revoked';
    case NotEligible = 'not_eligible';

    public function isOk(): bool
    {
        return $this === self::Ok;
    }
}
