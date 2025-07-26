<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'tenant_id', // Added tenant_id
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function isSuperAdmin(): bool
    {
        return is_null($this->tenant_id);
    }

    /**
     * Check if user has access to a specific module
     */
    public function hasModuleAccess(string $module): bool
    {
        // Super admin has access to everything
        if ($this->isSuperAdmin()) {
            return true;
        }

        // Check if user has any roles first
        if (!$this->hasAnyRole()) {
            return false;
        }

        // Use direct database query to check permissions
        try {
            $permission = \Spatie\Permission\Models\Permission::where('name', "access {$module}")->first();
            if (!$permission) {
                return false;
            }

            // Check if user has this permission through any of their roles
            $hasPermission = \DB::table('model_has_permissions')
                ->where('model_type', self::class)
                ->where('model_id', $this->id)
                ->where('permission_id', $permission->id)
                ->exists();

            if ($hasPermission) {
                return true;
            }

            // Check if any of user's roles have this permission
            $userRoles = \DB::table('model_has_roles')
                ->where('model_type', self::class)
                ->where('model_id', $this->id)
                ->pluck('role_id');

            if ($userRoles->isEmpty()) {
                return false;
            }

            $roleHasPermission = \DB::table('role_has_permissions')
                ->whereIn('role_id', $userRoles)
                ->where('permission_id', $permission->id)
                ->exists();

            return $roleHasPermission;
        } catch (\Exception $e) {
            \Log::error('Error checking module access: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if user has any roles
     */
    public function hasAnyRole(): bool
    {
        try {
            return \DB::table('model_has_roles')
                ->where('model_type', self::class)
                ->where('model_id', $this->id)
                ->exists();
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get all accessible modules for this user
     */
    public function getAccessibleModules(): array
    {
        // Super admin has access to everything
        if ($this->isSuperAdmin()) {
            return ['dashboard', 'pos', 'customers', 'products', 'categories', 'orders', 'reports', 'sales-monitoring'];
        }

        // If user has no roles, return empty array
        if (!$this->hasAnyRole()) {
            return [];
        }

        $modules = [];
        $allModules = ['dashboard', 'pos', 'customers', 'products', 'categories', 'orders', 'reports', 'sales-monitoring'];
        
        foreach ($allModules as $module) {
            if ($this->hasModuleAccess($module)) {
                $modules[] = $module;
            }
        }
        
        return $modules;
    }
}
