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
