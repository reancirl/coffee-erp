<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Task 8.2 — let an employee cover part of an order with their allowance
 * and pay the difference in cash.
 *
 * The cash half reuses `split_cash_amount`, which already means "the cash
 * portion of a split". This adds the allowance portion beside it. Existing
 * Cash + GCash splits are untouched and leave this NULL.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('split_allowance_amount', 10, 2)->nullable()->after('split_gcash_amount');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('split_allowance_amount');
        });
    }
};
