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
        // Barista Drink - Coffee category (ID: 1)
        Product::create([
            'name' => 'Barista Drink',
            'price' => 155,
            'category' => 1,
            'is_add_on' => false,
        ]);
    }
}
