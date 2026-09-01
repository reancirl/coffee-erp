<?php

namespace App\Support;

use App\Enums\QrResolution;
use App\Models\EmployeeQrCredential;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

/**
 * Issues, revokes and resolves employee QR credentials.
 *
 * One active credential per employee: issuing a new one revokes the old one in
 * the same transaction, which is what makes a lost printout stop working.
 */
class EmployeeQr
{
    private const MAX_ATTEMPTS = 5;

    /**
     * Current usable credential, or null if the employee has none.
     */
    public static function activeFor(User $user): ?EmployeeQrCredential
    {
        return $user->qrCredentials()->active()->latest('issued_at')->first();
    }

    /**
     * Issue a fresh credential, revoking any existing one.
     *
     * Safe to call repeatedly — each call invalidates the previous QR, which is
     * exactly the "lost my printout" flow.
     */
    public static function issueFor(User $user, ?User $actor = null): EmployeeQrCredential
    {
        return DB::transaction(function () use ($user, $actor) {
            self::revokeFor($user, $actor);

            for ($attempt = 1; $attempt <= self::MAX_ATTEMPTS; $attempt++) {
                try {
                    return $user->qrCredentials()->create([
                        'token' => EmployeeQrCredential::generateToken(),
                        'issued_at' => now(),
                        'issued_by' => $actor?->id,
                    ]);
                } catch (UniqueConstraintViolationException $e) {
                    // Astronomically unlikely, but the unique index is the
                    // authority rather than our assumption about randomness.
                    if ($attempt === self::MAX_ATTEMPTS) {
                        throw $e;
                    }
                }
            }

            throw new \RuntimeException('Unable to issue a QR credential.');
        });
    }

    /**
     * Revoke every active credential the user holds.
     *
     * Rows are kept, never deleted: allowance history and the audit trail must
     * survive a revocation.
     *
     * @return int number of credentials revoked
     */
    public static function revokeFor(User $user, ?User $actor = null): int
    {
        return $user->qrCredentials()->active()->update([
            'revoked_at' => now(),
            'revoked_by' => $actor?->id,
        ]);
    }

    /**
     * Resolve a scanned value to an employee.
     *
     * @return array{resolution: QrResolution, user: ?User, credential: ?EmployeeQrCredential, message: ?string}
     */
    public static function resolve(string $scanned): array
    {
        $scanned = trim($scanned);

        $credential = EmployeeQrCredential::with('user')->where('token', $scanned)->first();

        if ($credential === null) {
            return self::outcome(QrResolution::Unknown, null, null, 'Employee not found.');
        }

        if ($credential->isRevoked()) {
            return self::outcome(
                QrResolution::Revoked,
                $credential->user,
                $credential,
                'This QR has been revoked. Ask the admin to issue a new one.',
            );
        }

        $user = $credential->user;

        // Eligibility is still Phase 1's decision — a valid QR does not by
        // itself entitle anyone to anything.
        if ($user === null || ! $user->canRedeemAllowance()) {
            return self::outcome(
                QrResolution::NotEligible,
                $user,
                $credential,
                $user?->allowanceIneligibilityReason() ?? 'This employee no longer exists.',
            );
        }

        return self::outcome(QrResolution::Ok, $user, $credential, null);
    }

    /** @return array{resolution: QrResolution, user: ?User, credential: ?EmployeeQrCredential, message: ?string} */
    private static function outcome(QrResolution $resolution, ?User $user, ?EmployeeQrCredential $credential, ?string $message): array
    {
        return [
            'resolution' => $resolution,
            'user' => $user,
            'credential' => $credential,
            'message' => $message,
        ];
    }
}
