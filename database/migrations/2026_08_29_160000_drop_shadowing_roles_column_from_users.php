<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
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
     * The column was dead in development — never written to by any code, null
     * for every user. It is NOT assumed dead everywhere: if a deployment has
     * real values in it, this migration refuses to run rather than destroying
     * data that nothing else knows how to reconstruct.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'roles')) {
            return;
        }

        $populated = DB::table('users')->whereNotNull('roles')->where('roles', '!=', '')->count();

        if ($populated > 0) {
            $sample = DB::table('users')
                ->whereNotNull('roles')
                ->where('roles', '!=', '')
                ->limit(5)
                ->pluck('roles')
                ->implode(', ');

            throw new RuntimeException(
                "Refusing to drop `users.roles`: {$populated} row(s) still hold a value (e.g. {$sample}). "
                ."Dropping it would destroy data nothing else can reconstruct.\n\n"
                ."This column shadows Spatie's roles() relation and breaks hasRole() for every user, "
                ."so it does need to go — but move the values into Spatie roles first:\n"
                ."  1. Inspect them:  SELECT id, name, roles FROM users WHERE roles IS NOT NULL;\n"
                ."  2. Assign the equivalent Spatie role to each user (\$user->assignRole(...)).\n"
                ."  3. Clear the column:  UPDATE users SET roles = NULL;\n"
                ."  4. Re-run this migration.\n"
            );
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('roles');
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'roles')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->string('roles')->nullable();
        });
    }
};
