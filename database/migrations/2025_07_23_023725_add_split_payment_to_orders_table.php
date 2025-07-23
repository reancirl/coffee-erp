<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('split_cash_amount', 10, 2)->nullable()->after('payment_method');
            $table->decimal('split_gcash_amount', 10, 2)->nullable()->after('split_cash_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['split_cash_amount', 'split_gcash_amount']);
        });
    }
};
