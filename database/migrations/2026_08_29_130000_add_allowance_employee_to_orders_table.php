<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Which employee an allowance order was redeemed against.
     *
     * Separate from `user_id`, which is the cashier who rang it up: the
     * dispute case ("I didn't redeem that") needs both sides recorded.
     * Nullable because every non-allowance order leaves it empty.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('allowance_user_id')->nullable()->after('user_id')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['allowance_user_id']);
            $table->dropColumn('allowance_user_id');
        });
    }
};
