<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Tenant;
use App\Models\Subscription;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Super Admin',
            'email' => 'admin@admin.com',
            'password' => bcrypt('password'),
            'tenant_id' => null,
        ]);

        $subscription = Subscription::create([
            'plan_name' => 'Infinite Plan',
            'price' => 0.00,
            'start_date' => now(),
            'end_date' => now()->addMonth(),
        ]);

        $tenant = Tenant::create([
            'name' => 'Coffee Shop A',
            'subscription_id' => $subscription->id,
        ]);

        User::create([
            'name' => 'Tenant Admin',
            'email' => 'tenant@coffee.com',
            'password' => bcrypt('password'),
            'tenant_id' => $tenant->id,
        ]);
        
        // Call the category and product seeders
        $this->call([
            CategorySeeder::class,
            ProductSeeder::class,
        ]);
    }
}
