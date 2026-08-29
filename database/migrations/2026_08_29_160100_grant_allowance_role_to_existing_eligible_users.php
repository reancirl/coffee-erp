<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    /**
     * Role membership became a prerequisite for the allowance.
     *
     * Anyone already marked eligible was granted it under the old rule, so
     * give them the role rather than silently switching off their allowance
     * (which would also stop their QR from working).
     */
    public function up(): void
    {
        $roleName = config('allowance.role');
        $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);

        User::where('allowance_eligible', true)->get()->each(function (User $user) use ($role) {
            if (! $user->hasRole($role)) {
                $user->assignRole($role);
            }
        });
    }

    public function down(): void
    {
        // Removing the role on rollback would strip access granted for other
        // reasons, so this is intentionally not reversed.
    }
};
