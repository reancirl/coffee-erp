<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    /**
     * The allowance page moved out of settings into its own module, so the
     * role now needs the matching permission or eligible devs would lose
     * access to their own QR.
     */
    public function up(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permission = Permission::firstOrCreate(['name' => 'access coffee-allowance', 'guard_name' => 'web']);

        $role = Role::firstOrCreate(['name' => config('allowance.role'), 'guard_name' => 'web']);
        $role->givePermissionTo($permission);

        // Admins keep seeing everything.
        Role::where('name', 'Admin')->first()?->givePermissionTo($permission);
    }

    public function down(): void
    {
        Role::where('name', config('allowance.role'))->first()?->revokePermissionTo('access coffee-allowance');
    }
};
