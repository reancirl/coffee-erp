<?php

namespace App\Exceptions;

use App\Models\User;

/**
 * Raised when deleting a user would destroy allowance ledger rows.
 *
 * The foreign keys cascade, so the delete would take the audit trail with it.
 * Ledger history has to outlive the account.
 */
class AllowanceHistoryExistsException extends \RuntimeException
{
    public function __construct(public readonly User $user)
    {
        parent::__construct(
            'This account has coffee allowance history and cannot be deleted. '
            .'Set the employee to inactive instead so the ledger is preserved.'
        );
    }
}
