<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Remove the unused `users.roles` string column.
     *
     * Eloquent resolves attributes before relations, so this column shadowed
     * Spatie's roles() relation: `$user->roles` returned the column (always
     * null) instead of the role collection, which made hasRole() and
     * getRoleNames() throw for every user, and made the /user-roles screen
     * serialise `roles: null`.
     *
     * The column was never written to by any code and held no data.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'roles')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('roles');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('roles')->nullable();
        });
    }
};
