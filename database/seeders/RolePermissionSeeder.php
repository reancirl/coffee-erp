<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Define modules and their permissions
        $modules = [
            'dashboard' => 'Dashboard access and overview',
            'pos' => 'Point of Sale operations',
            'customers' => 'Customer management',
            'products' => 'Product management',
            'categories' => 'Category management',
            'orders' => 'Order management and history',
            'reports' => 'Reports and analytics',
            'sales-monitoring' => 'Cash monitoring and sales tracking'
        ];

        // Create permissions for each module (or get existing ones)
        foreach ($modules as $module => $description) {
            Permission::firstOrCreate([
                'name' => "access {$module}",
                'guard_name' => 'web'
            ]);
        }
        
        // Create Admin role with all permissions (or get existing one)
        $admin = Role::firstOrCreate(['name' => 'Admin']);
        $admin->syncPermissions(Permission::all());
        
        // Assign Admin role to first user using direct database insertion
        $adminUser = User::first();
        if ($adminUser) {
            // Check if user already has this role
            $existingRole = \DB::table('model_has_roles')
                ->where('model_type', User::class)
                ->where('model_id', $adminUser->id)
                ->where('role_id', $admin->id)
                ->first();
            
            if (!$existingRole) {
                // Insert role assignment directly into database
                \DB::table('model_has_roles')->insert([
                    'role_id' => $admin->id,
                    'model_type' => User::class,
                    'model_id' => $adminUser->id,
                ]);
                $this->command->info("Assigned Admin role to user: {$adminUser->email}");
            } else {
                $this->command->info("User {$adminUser->email} already has Admin role");
            }
        }
        
        $this->command->info('Role and permission seeding completed successfully!');
    }
}
