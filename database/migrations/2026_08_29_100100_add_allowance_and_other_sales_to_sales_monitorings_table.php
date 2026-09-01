<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Give non-cash settlement its own buckets.
     *
     * `allowance_sales` holds Employee Allowance redemptions and
     * `other_sales` catches any payment method the app does not recognise,
     * so neither disappears from sales monitoring. Neither feeds the expected
     * cash-drawer balance.
     */
    public function up(): void
    {
        Schema::table('sales_monitorings', function (Blueprint $table) {
            $table->decimal('allowance_sales', 10, 2)->default(0)->after('split_gcash_sales');
            $table->decimal('other_sales', 10, 2)->default(0)->after('allowance_sales');
        });
    }

    public function down(): void
    {
        Schema::table('sales_monitorings', function (Blueprint $table) {
            $table->dropColumn(['allowance_sales', 'other_sales']);
        });
    }
};
