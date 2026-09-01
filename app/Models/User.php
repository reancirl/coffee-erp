<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\EmploymentStatus;
use App\Support\EmployeeCode;
use App\Support\EmployeeQr;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Route;
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

    protected static function boot()
    {
        parent::boot();

        // The allowance ledger is an audit record. The database cascades on
        // user_id, so deleting a user would wipe their periods, transactions
        // and QR history without any of the model-level guards firing —
        // reachable by the employee themselves via profile deletion.
        static::deleting(function (User $user) {
            if ($user->allowanceTransactions()->exists()) {
                throw new \App\Exceptions\AllowanceHistoryExistsException($user);
            }
        });
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
     * Allowance periods, including historical ones.
     */
    public function allowancePeriods(): HasMany
    {
        return $this->hasMany(AllowancePeriod::class);
    }

    public function allowanceTransactions(): HasMany
    {
        return $this->hasMany(AllowanceTransaction::class);
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
            && $this->hasAllowanceRole()
            && $this->allowance_eligible === true
            && filled($this->employee_code);
    }

    /**
     * Is this person in the role the allowance exists for?
     *
     * Membership is the structural entitlement; `allowance_eligible` is the
     * individual on/off switch layered over it.
     */
    public function hasAllowanceRole(): bool
    {
        return $this->hasRole(config('allowance.role'));
    }

    /**
     * Why redemption is refused, for cashier-facing messages. Null when allowed.
     */
    public function allowanceIneligibilityReason(): ?string
    {
        if (! $this->isActive()) {
            return 'This employee is not active.';
        }

        if (! $this->hasAllowanceRole()) {
            return 'This employee is not in the '.config('allowance.role').' role.';
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
     * Where this user should land after logging in.
     *
     * Everything in the app is module-gated, so a rank-and-file employee with
     * no modules used to be dropped straight onto a 403 dashboard with no way
     * to reach even their own coffee QR. Send them somewhere they can actually
     * use instead.
     */
    public function landingRoute(): string
    {
        $modules = $this->getAccessibleModules();

        if (in_array('dashboard', $modules, true)) {
            return route('dashboard', absolute: false);
        }

        $firstModuleRoute = [
            'coffee-allowance' => 'coffee-allowance.show',
            'pos' => 'pos',
            'orders' => 'orders.index',
            'sales-monitoring' => 'sales-monitoring.index',
            'products' => 'products.index',
            'customers' => 'customers.index',
            'categories' => 'categories.index',
            'reports' => 'reports.z-report',
            'event-booking' => 'event-bookings.index',
        ];

        foreach ($modules as $module) {
            if (isset($firstModuleRoute[$module]) && Route::has($firstModuleRoute[$module])) {
                return route($firstModuleRoute[$module], absolute: false);
            }
        }

        // Nothing at all is reachable: send them to their profile rather than
        // bouncing them into a 403 they cannot navigate away from.
        return route('profile.edit', absolute: false);
    }

    /**
     * May this user post a manual allowance adjustment?
     *
     * Adjustments move money without a sale behind them, so they are held to a
     * higher bar than ordinary POS work: super admins, or an explicitly
     * granted permission. Being a cashier is not enough.
     */
    public function canAdjustAllowances(): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        // The permission may not be seeded yet; treat absence as "no".
        try {
            return $this->hasPermissionTo('adjust allowance');
        } catch (\Throwable) {
            return false;
        }
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
            ->whereNotNull('employee_code')
            ->role(config('allowance.role'));
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
        $general = ['dashboard', 'pos', 'customers', 'products', 'categories', 'orders', 'reports', 'sales-monitoring', 'event-booking'];

        // Super admin has access to every administrative module.
        if ($this->isSuperAdmin()) {
            $modules = $general;
        } elseif (! $this->hasAnyRole()) {
            $modules = [];
        } else {
            $modules = array_values(array_filter($general, fn (string $module) => $this->hasModuleAccess($module)));
        }

        // Coffee allowance is personal, not administrative: it is "my
        // allowance", so it belongs in the nav only for people who actually
        // hold one. Being an admin does not earn you coffee, and showing the
        // page to someone who can never use it is noise.
        //
        // Role, not canRedeemAllowance(): someone in the role but individually
        // switched off still needs to see the page to learn why.
        if ($this->hasAllowanceRole()) {
            $modules[] = 'coffee-allowance';
        }

        return $modules;
    }
}
