<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One row per employee per month.
     *
     * `amount` is a snapshot, not a lookup: if management raises the monthly
     * allowance, periods already opened keep the figure they were created with.
     */
    public function up(): void
    {
        Schema::create('allowance_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->date('starts_on');
            $table->date('ends_on');
            $table->decimal('amount', 10, 2);

            $table->timestamps();

            // Periods are whole calendar months, so a unique start date per
            // employee is what makes overlaps impossible at the database level.
            $table->unique(['user_id', 'starts_on']);
            $table->index(['user_id', 'starts_on', 'ends_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('allowance_periods');
    }
};
