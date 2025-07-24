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
        Schema::create('cash_monitorings', function (Blueprint $table) {
            $table->id();
            $table->date('monitoring_date')->unique();
            $table->decimal('opening_balance', 10, 2)->default(0);
            $table->decimal('cash_sales', 10, 2)->default(0);
            $table->decimal('gcash_sales', 10, 2)->default(0);
            $table->decimal('split_cash_sales', 10, 2)->default(0);
            $table->decimal('split_gcash_sales', 10, 2)->default(0);
            $table->decimal('cash_in', 10, 2)->default(0);
            $table->decimal('cash_out', 10, 2)->default(0);
            $table->decimal('expected_balance', 10, 2)->default(0);
            $table->decimal('actual_balance', 10, 2)->nullable();
            $table->decimal('variance', 10, 2)->default(0);
            $table->text('cash_in_notes')->nullable();
            $table->text('cash_out_notes')->nullable();
            $table->text('variance_notes')->nullable();
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->unsignedBigInteger('opened_by')->nullable();
            $table->unsignedBigInteger('closed_by')->nullable();
            $table->timestamp('opened_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
            
            $table->foreign('opened_by')->references('id')->on('users');
            $table->foreign('closed_by')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cash_monitorings');
    }
};
