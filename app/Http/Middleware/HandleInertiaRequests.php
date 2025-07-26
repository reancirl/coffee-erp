<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
                'permissions' => $this->getUserPermissions($request->user()),
                'roles' => $this->getUserRoles($request->user()),
                'accessibleModules' => $this->getUserAccessibleModules($request->user()),
            ],
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * Safely get user permissions
     */
    private function getUserPermissions($user): array
    {
        if (!$user) {
            return [];
        }

        try {
            // Simple approach: just return empty for now to avoid errors
            // We'll use the accessible modules instead
            return [];
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Safely get user roles
     */
    private function getUserRoles($user): array
    {
        if (!$user) {
            return [];
        }

        try {
            // Simple approach: just return empty for now to avoid errors
            // We'll use the accessible modules instead
            return [];
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Safely get user accessible modules
     */
    private function getUserAccessibleModules($user): array
    {
        if (!$user) {
            return [];
        }

        try {
            // Check if user is super admin (tenant_id is null)
            if (is_null($user->tenant_id)) {
                return ['dashboard', 'pos', 'customers', 'products', 'categories', 'orders', 'reports', 'sales-monitoring'];
            }

            // Check if user has any roles using direct database query
            $hasRoles = \DB::table('model_has_roles')
                ->where('model_type', \App\Models\User::class)
                ->where('model_id', $user->id)
                ->exists();

            if (!$hasRoles) {
                return []; // No roles = no access
            }

            // Get user's role IDs
            $userRoleIds = \DB::table('model_has_roles')
                ->where('model_type', \App\Models\User::class)
                ->where('model_id', $user->id)
                ->pluck('role_id');

            if ($userRoleIds->isEmpty()) {
                return [];
            }

            // Get permissions for these roles
            $permissionNames = \DB::table('role_has_permissions')
                ->join('permissions', 'role_has_permissions.permission_id', '=', 'permissions.id')
                ->whereIn('role_has_permissions.role_id', $userRoleIds)
                ->pluck('permissions.name');

            // Extract modules from permission names (e.g., "access dashboard" -> "dashboard")
            $modules = [];
            foreach ($permissionNames as $permission) {
                if (str_starts_with($permission, 'access ')) {
                    $module = str_replace('access ', '', $permission);
                    $modules[] = $module;
                }
            }

            return array_unique($modules);
        } catch (\Exception $e) {
            \Log::error('Error getting accessible modules: ' . $e->getMessage());
            return [];
        }
    }
}
