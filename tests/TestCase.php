<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
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
        $user->assignRole($role);

        return $user->refresh();
    }
}
