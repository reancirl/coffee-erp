<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Tenant;
use App\Models\Subscription;
use App\Models\Product;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Commenting out existing reancirl@gmail.com since it already exists
        // User::create([
        //     'name' => 'Super Admin',
        //     'email' => 'reancirl@gmail.com',
        //     'password' => bcrypt('califoRnication^1999'),
        //     'tenant_id' => null,
        // ]);

        // Additional user seeders
        User::create([
            'name' => 'Chermae',
            'email' => 'sheeermae@gmail.com',
            'password' => bcrypt('password'),
            'tenant_id' => null,
        ]);

        User::create([
            'name' => 'Jorille',
            'email' => 'jorilleboyonas@gmail.com',
            'password' => bcrypt('password'),
            'tenant_id' => null,
        ]);

        User::create([
            'name' => 'Jeff',
            'email' => 'jekcara8@gmail.com',
            'password' => bcrypt('password'),
            'tenant_id' => null,
        ]);

        User::create([
            'name' => 'Jorgen',
            'email' => 'jorgengilfosgate@gmail.com',
            'password' => bcrypt('password'),
            'tenant_id' => null,
        ]);

        User::create([
            'name' => 'Mel',
            'email' => 'melmathewparedes@gmail.com',
            'password' => bcrypt('password'),
            'tenant_id' => null,
        ]);

        User::create([
            'name' => 'Rex',
            'email' => 'nrexgeo@gmail.com',
            'password' => bcrypt('password'),
            'tenant_id' => null,
        ]);

        User::create([
            'name' => 'Russel',
            'email' => 'russeljessheyrana@gmail.com',
            'password' => bcrypt('password'),
            'tenant_id' => null,
        ]);

        User::create([
            'name' => 'Sharmaine',
            'email' => 'skripts0324@gmail.com',
            'password' => bcrypt('password'),
            'tenant_id' => null,
        ]);

        // charminemagbanua4@gmail.com
        User::create([
            'name' => 'Dimple',
            'email' => 'charminemagbanua4@gmail.com',
            'password' => bcrypt('password'),
            'tenant_id' => null,
        ]);

        // desiertoyanna0602@gmail.com
        User::create([
            'name' => 'Yanna',
            'email' => 'desiertoyanna0602@gmail.com',
            'password' => bcrypt('password'),
            'tenant_id' => null,
        ]);

        // Additional Products
        // Chia seeds - Add-On category (ID: 6)
        Product::create([
            'name' => 'Chia Seeds',
            'price' => 15,
            'category' => 6,
            'is_add_on' => true,
        ]);

        // Korean Ramen - Food category (ID: 8)
        Product::create([
            'name' => 'Korean Ramen',
            'price' => 130,
            'category' => 8,
            'is_add_on' => false,
        ]);

        // $subscription = Subscription::create([
        //     'plan_name' => 'Infinite Plan',
        //     'price' => 0.00,
        //     'start_date' => now(),
        //     'end_date' => now()->addMonth(),
        // ]);

        // $tenant = Tenant::create([
        //     'name' => 'Coffee Shop A',
        //     'subscription_id' => $subscription->id,
        // ]);

        // User::create([
        //     'name' => 'Tenant Admin',
        //     'email' => 'tenant@coffee.com',
        //     'password' => bcrypt('password'),
        //     'tenant_id' => $tenant->id,
        // ]);
        
        // Call the category and product seeders
        // $this->call([
        //     CategorySeeder::class,
        //     ProductSeeder::class,
        // ]);


    }
}
