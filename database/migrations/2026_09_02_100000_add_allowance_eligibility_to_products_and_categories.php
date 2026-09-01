<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Task 9.1 — decide which products the coffee allowance may be spent on.
 *
 * Eligibility is held on the category, because that is how the menu is
 * already organised: drinks are covered, retail beans and merchandise are
 * not. The column on products is a deliberate override and defaults to
 * NULL, meaning "whatever the category says". Everything existing stays
 * eligible, so turning this on changes nothing until someone opts a
 * category out.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->boolean('allowance_eligible')->default(true)->after('description');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->boolean('allowance_eligible')->nullable()->default(null)->after('is_add_on');
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('allowance_eligible');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('allowance_eligible');
        });
    }
};
