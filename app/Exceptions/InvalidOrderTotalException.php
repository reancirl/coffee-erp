<?php

namespace App\Exceptions;

/**
 * Thrown when the computed order total is not a value we can charge.
 *
 * Discounts are validated as non-negative but have no upper bound, so a large
 * enough one drives the total to zero or below. Left unchecked that posts
 * negative revenue into sales monitoring, or asks the allowance ledger to
 * redeem nothing.
 */
class InvalidOrderTotalException extends \RuntimeException
{
    public function __construct(string $message, public readonly string $field = 'discount')
    {
        parent::__construct($message);
    }
}
