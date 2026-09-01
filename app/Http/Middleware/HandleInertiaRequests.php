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
    /**
     * Modules the sidebar is allowed to show.
     *
     * Delegates to the model rather than repeating the rules: this used to
     * carry its own hardcoded super-admin module list, which silently drifted
     * out of sync with User::getAccessibleModules() and dropped new modules
     * from the sidebar while their routes still worked.
     */
    private function getUserAccessibleModules($user): array
    {
        if (! $user) {
            return [];
        }

        try {
            return $user->getAccessibleModules();
        } catch (\Throwable $e) {
            \Log::error('Error getting accessible modules: '.$e->getMessage());

            return [];
        }
    }
}
