<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

abstract class TestCase extends BaseTestCase
{
    /**
     * Put a user in the role the coffee allowance is attached to.
     *
     * Role membership is a prerequisite for eligibility, so most allowance
     * fixtures need this alongside the `allowance_eligible` switch.
     */
    protected function grantAllowanceRole(User $user): User
    {
        $role = Role::firstOrCreate(['name' => config('allowance.role'), 'guard_name' => 'web']);

        // Mirrors the seeder: the role also carries the module permission, so
        // one assignment makes someone eligible AND lets them open the page.
        $permission = Permission::firstOrCreate(['name' => 'access coffee-allowance', 'guard_name' => 'web']);
        $role->givePermissionTo($permission);

        $user->assignRole($role);
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return $user->refresh();
    }
}
