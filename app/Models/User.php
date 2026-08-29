<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\EmploymentStatus;
use App\Support\EmployeeCode;
use App\Support\EmployeeQr;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
        'position',
        'employment_status',
        'allowance_eligible',
    ];

    /**
     * `employee_code` is deliberately NOT mass assignable. It is issued once by
     * EmployeeCode and must never be reassigned from request input, because
     * historical transactions are read back through it.
     */

    /**
     * Mirror the database defaults in memory, so a freshly built User reports
     * the same eligibility as one loaded back from the database.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'employment_status' => 'active',
        'allowance_eligible' => false,
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
            'employment_status' => EmploymentStatus::class,
            'allowance_eligible' => 'boolean',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Orders this user rang up as cashier.
     */
    public function processedOrders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Every QR credential ever issued to this user, revoked ones included.
     */
    public function qrCredentials(): HasMany
    {
        return $this->hasMany(EmployeeQrCredential::class);
    }

    /**
     * The credential a scanner would currently accept, if any.
     */
    public function activeQrCredential(): ?EmployeeQrCredential
    {
        return EmployeeQr::activeFor($this);
    }

    public function isActive(): bool
    {
        return $this->employment_status?->isActive() ?? false;
    }

    /**
     * The single authority on whether this person may redeem a coffee
     * allowance. Every redemption path must ask this and nothing else.
     *
     * Deliberately independent of roles and module permissions: those govern
     * what a user may *operate* in the app, while this is an HR entitlement.
     * A manager with full admin rights still gets no free coffee unless HR
     * marked them eligible.
     */
    public function canRedeemAllowance(): bool
    {
        return $this->isActive()
            && $this->allowance_eligible === true
            && filled($this->employee_code);
    }

    /**
     * Why redemption is refused, for cashier-facing messages. Null when allowed.
     */
    public function allowanceIneligibilityReason(): ?string
    {
        if (! $this->isActive()) {
            return 'This employee is not active.';
        }

        if ($this->allowance_eligible !== true) {
            return 'This employee is not eligible for the coffee allowance.';
        }

        if (blank($this->employee_code)) {
            return 'This employee has no employee code.';
        }

        return null;
    }

    /**
     * Issue this user's permanent employee code, or return the existing one.
     */
    public function assignEmployeeCode(): string
    {
        return EmployeeCode::assignTo($this);
    }

    /** Users who may currently redeem an allowance. */
    public function scopeAllowanceEligible(Builder $query): Builder
    {
        return $query->where('allowance_eligible', true)
            ->where('employment_status', EmploymentStatus::Active->value)
            ->whereNotNull('employee_code');
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
            return ['dashboard', 'pos', 'customers', 'products', 'categories', 'orders', 'reports', 'sales-monitoring', 'event-booking'];
        }

        // If user has no roles, return empty array
        if (!$this->hasAnyRole()) {
            return [];
        }

        $modules = [];
        $allModules = ['dashboard', 'pos', 'customers', 'products', 'categories', 'orders', 'reports', 'sales-monitoring', 'event-booking'];
        
        foreach ($allModules as $module) {
            if ($this->hasModuleAccess($module)) {
                $modules[] = $module;
            }
        }
        
        return $modules;
    }
}
