<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Monthly allowance amount
    |--------------------------------------------------------------------------
    |
    | The peso value a new allowance period is opened with. Changing this only
    | affects periods created afterwards: every period stores the amount that
    | applied when it was opened, so history is never rewritten.
    |
    */

    'monthly_amount' => (float) env('ALLOWANCE_MONTHLY_AMOUNT', 1000),

    /*
    |--------------------------------------------------------------------------
    | Eligible role
    |--------------------------------------------------------------------------
    |
    | Membership of this role is a prerequisite for the coffee allowance: the
    | perk exists because developers hold their meetings at the coffee shop.
    | The per-person `allowance_eligible` switch is applied on top, so one
    | person can be suspended without losing the role itself.
    |
    */

    'role' => env('ALLOWANCE_ROLE', 'Swiftly Developer'),

    /*
    |--------------------------------------------------------------------------
    | Business timezone
    |--------------------------------------------------------------------------
    |
    | Which clock decides when a month starts and ends. The app runs in UTC,
    | which is eight hours behind Manila — without this, a coffee bought at
    | 07:00 on the 1st would be billed to the previous month's allowance.
    |
    */

    'timezone' => env('ALLOWANCE_TIMEZONE', 'Asia/Manila'),

];
