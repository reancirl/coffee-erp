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
        Schema::create('cash_remittances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_monitoring_id')->constrained('sales_monitorings')->cascadeOnDelete();
            $table->string('destination');
            $table->string('method');
            $table->decimal('amount', 12, 2);
            $table->string('reference')->nullable();
            $table->string('attachment_path')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('pending'); // pending, confirmed
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cash_remittances');
    }
};
