<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Tenant;
use App\Models\Subscription;
use App\Models\Product;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::create([
        //     'name' => 'Super Admin',
        //     'email' => 'admin@admin.com',
        //     'password' => Hash::make('password'),
        // ]);

        Tenant::create([
            'name' => 'Eastlone',
        ]);

        // User::create([
        //     'name' => 'test staff',
        //     'email' => 'test@admin.com',
        //     'password' => Hash::make('password'),
        //     'tenant_id' => 1,
        // ]);

        $this->call(RolePermissionSeeder::class);
    }
}
