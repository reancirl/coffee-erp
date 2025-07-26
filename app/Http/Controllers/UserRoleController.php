<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Redirect;

class UserRoleController extends Controller
{
    /**
     * Display user role management page
     */
    public function index()
    {
        $users = User::with('roles')->paginate(30);
        $roles = Role::all();
        
        return Inertia::render('user-roles/Index', [
            'users' => $users,
            'roles' => $roles,
        ]);
    }

    /**
     * Show form for editing user roles
     */
    public function edit(User $user)
    {
        $user->load('roles');
        $roles = Role::all();
        
        return Inertia::render('user-roles/Form', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    /**
     * Update user roles
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'roles' => 'array',
            'roles.*' => 'exists:roles,id',
        ]);

        try {
            // Get role IDs
            $roleIds = $request->roles ?? [];
            
            // Remove all existing roles for this user
            \DB::table('model_has_roles')
                ->where('model_type', User::class)
                ->where('model_id', $user->id)
                ->delete();
            
            // Add new roles
            if (!empty($roleIds)) {
                $insertData = [];
                foreach ($roleIds as $roleId) {
                    $insertData[] = [
                        'role_id' => $roleId,
                        'model_type' => User::class,
                        'model_id' => $user->id,
                    ];
                }
                \DB::table('model_has_roles')->insert($insertData);
            }

            return Redirect::route('user-roles.index')
                ->with('success', 'User roles updated successfully.');
        } catch (\Exception $e) {
            return Redirect::route('user-roles.index')
                ->with('error', 'Failed to update user roles. Please try again.');
        }
    }

    /**
     * Assign role to user via AJAX
     */
    public function assignRole(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        try {
            $role = Role::findById($request->role_id);
            
            // Check if user already has this role using direct database query
            $existingRole = \DB::table('model_has_roles')
                ->where('model_type', User::class)
                ->where('model_id', $user->id)
                ->where('role_id', $role->id)
                ->first();
            
            if ($existingRole) {
                return Redirect::back()
                    ->with('error', "User {$user->name} already has the role '{$role->name}'.");
            }
            
            // Use direct database assignment
            \DB::table('model_has_roles')->insert([
                'role_id' => $role->id,
                'model_type' => User::class,
                'model_id' => $user->id,
            ]);

            return Redirect::back()
                ->with('success', "Role '{$role->name}' assigned to {$user->name}.");
        } catch (\Exception $e) {
            return Redirect::back()
                ->with('error', 'Failed to assign role. Please try again.');
        }
    }

    /**
     * Remove role from user
     */
    public function removeRole(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        try {
            $role = Role::findById($request->role_id);
            
            // Check if user has this role using direct database query
            $existingRole = \DB::table('model_has_roles')
                ->where('model_type', User::class)
                ->where('model_id', $user->id)
                ->where('role_id', $role->id)
                ->first();
            
            if (!$existingRole) {
                return Redirect::back()
                    ->with('error', "User {$user->name} does not have the role '{$role->name}'.");
            }
            
            // Use direct database removal
            \DB::table('model_has_roles')
                ->where('model_type', User::class)
                ->where('model_id', $user->id)
                ->where('role_id', $role->id)
                ->delete();

            return Redirect::back()
                ->with('success', "Role '{$role->name}' removed from {$user->name}.");
        } catch (\Exception $e) {
            return Redirect::back()
                ->with('error', 'Failed to remove role. Please try again.');
        }
    }
}
