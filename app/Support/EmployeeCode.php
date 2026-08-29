<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;

/**
 * Issues sequential employee codes (SW-001, SW-002, ...).
 *
 * The code is a pure identifier: it encodes no balance, entitlement or money.
 * Anything financial hangs off the immutable user id instead, so a code can be
 * corrected without touching history.
 */
class EmployeeCode
{
    public const PREFIX = 'SW';

    private const PAD = 3;

    /** How many times to retry when two writers race for the same number. */
    private const MAX_ATTEMPTS = 5;

    /**
     * The next unused code in sequence.
     */
    public static function next(): string
    {
        $highest = User::query()
            ->whereNotNull('employee_code')
            ->where('employee_code', 'like', self::PREFIX.'-%')
            ->pluck('employee_code')
            ->map(fn (string $code) => (int) substr($code, strlen(self::PREFIX) + 1))
            ->max() ?? 0;

        return self::format($highest + 1);
    }

    public static function format(int $sequence): string
    {
        return self::PREFIX.'-'.str_pad((string) $sequence, self::PAD, '0', STR_PAD_LEFT);
    }

    /**
     * Give the user a code, keeping any code they already hold.
     *
     * A code is permanent once issued: reissuing would break the link between a
     * person and the transactions already recorded against them.
     *
     * The unique index is the real guarantee here — SQLite has no usable row
     * lock, so on a collision we simply recompute and try again.
     */
    public static function assignTo(User $user): string
    {
        if (filled($user->employee_code)) {
            return $user->employee_code;
        }

        for ($attempt = 1; $attempt <= self::MAX_ATTEMPTS; $attempt++) {
            $candidate = self::next();

            try {
                $user->forceFill(['employee_code' => $candidate])->save();

                return $candidate;
            } catch (UniqueConstraintViolationException $e) {
                $user->employee_code = null;

                if ($attempt === self::MAX_ATTEMPTS) {
                    throw $e;
                }
            }
        }

        throw new \RuntimeException('Unable to allocate an employee code.');
    }
}
