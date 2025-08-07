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
        Schema::create('feedback_responses', function (Blueprint $table) {
            $table->id();
            $table->string('overall_experience'); // Excellent, Good, Fair, Poor
            $table->text('enjoyed_most_least')->nullable(); // Open-ended response
            $table->integer('recommend_likelihood'); // 0-10 scale or converted to number
            $table->string('customer_name')->nullable(); // Optional for raffle
            $table->string('customer_email')->nullable(); // Optional for raffle
            $table->string('session_token')->nullable(); // To prevent duplicate submissions
            $table->timestamp('submitted_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feedback_responses');
    }
};
