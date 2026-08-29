<?php

namespace App\Exceptions;

/**
 * Thrown inside the order transaction when the employee's remaining allowance
 * cannot cover the order, so the whole order rolls back.
 */
class InsufficientAllowanceException extends \RuntimeException
{
    public function __construct(public readonly float $remaining, public readonly float $required)
    {
        parent::__construct(sprintf(
            'Insufficient allowance. Remaining %s, this order needs %s.',
            number_format($remaining, 2),
            number_format($required, 2),
        ));
    }
}
