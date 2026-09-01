<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Append-only ledger of allowance movement.
     *
     * Rows are never edited or deleted. A reversal (a voided order) is another
     * row with a positive amount, so the running balance is always the sum of
     * everything that ever happened.
     */
    public function up(): void
    {
        Schema::create('allowance_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('allowance_period_id')->constrained()->cascadeOnDelete();
            // Denormalised so an employee's ledger can be read without joining
            // through periods.
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();

            // Negative spends, positive refunds/adjustments.
            $table->decimal('amount', 10, 2);
            $table->string('type');
            $table->string('description')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->index(['user_id', 'allowance_period_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('allowance_transactions');
    }
};
