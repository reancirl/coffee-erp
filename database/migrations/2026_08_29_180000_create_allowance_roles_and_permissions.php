<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * Everything the coffee allowance needs from the role/permission system.
     *
     * Kept in a migration rather than the seeder so a deploy only has to run
     * `php artisan migrate`. Every step is idempotent, so it is safe whether
     * the seeder has run before, after, or not at all.
     */
    public function up(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $moduleAccess = Permission::firstOrCreate(['name' => 'access coffee-allowance', 'guard_name' => 'web']);

        // Adjustments move money with no sale behind them, so they are a
        // privileged action rather than a module.
        $adjust = Permission::firstOrCreate(['name' => 'adjust allowance', 'guard_name' => 'web']);

        // The role the allowance is attached to. It carries the module
        // permission and nothing else: devs have no other POS access, and a
        // single role assignment both grants eligibility and reveals the page.
        $allowanceRole = Role::firstOrCreate(['name' => config('allowance.role'), 'guard_name' => 'web']);
        $allowanceRole->givePermissionTo($moduleAccess);

        // Admins keep seeing everything. On a fresh install the Admin role may
        // not exist yet; the seeder syncs all permissions to it when it does.
        Role::where('name', 'Admin')->first()?->givePermissionTo([$moduleAccess, $adjust]);

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }

    public function down(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Leave the role itself: users are assigned to it and removing it
        // would silently strip their allowance eligibility.
        Permission::where('name', 'adjust allowance')->delete();
        Permission::where('name', 'access coffee-allowance')->delete();

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
};
