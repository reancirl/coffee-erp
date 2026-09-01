<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * QR credentials are rows, not a column on `users`.
     *
     * Revoked credentials are kept so a presented QR can be told apart:
     * "this was revoked" is a different (and more useful) answer than
     * "never seen this". It also leaves an audit trail of who reissued what.
     */
    public function up(): void
    {
        Schema::create('employee_qr_credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // The opaque scanned value. Carries no name, code, or balance.
            $table->string('token')->unique();

            $table->timestamp('issued_at');
            $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamp('revoked_at')->nullable();
            $table->foreignId('revoked_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            // Scanning looks up an active credential by token.
            $table->index(['user_id', 'revoked_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_qr_credentials');
    }
};
