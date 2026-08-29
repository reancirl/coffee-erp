<?php

use App\Enums\EmploymentStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Employee identity lives on `users` rather than in a parallel `employees`
     * table: a cashier and an allowance recipient are the same person, and a
     * second identity table would need constant reconciliation with this one.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Nullable + unique: only staff who need one carry a code, and
            // SQLite allows many NULLs under a unique index.
            $table->string('employee_code')->nullable()->unique()->after('id');
            $table->string('position')->nullable()->after('name');
            $table->string('employment_status')->default(EmploymentStatus::Active->value)->after('position');
            $table->boolean('allowance_eligible')->default(false)->after('employment_status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['employee_code']);
            $table->dropColumn(['employee_code', 'position', 'employment_status', 'allowance_eligible']);
        });
    }
};
