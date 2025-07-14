<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Categories from data.ts
        $categories = [
            ['name' => 'Coffee', 'description' => 'Hot and cold coffee beverages'],
            ['name' => 'Blended Drinks', 'description' => 'Milkshakes and frappes'],
            ['name' => 'River Fizz', 'description' => 'Sparkling refreshments'],
            ['name' => 'Black Trails', 'description' => 'Tea-based drinks'],
            ['name' => 'Greens & Grains', 'description' => 'Matcha and specialty drinks'],
            ['name' => 'Add-Ons', 'description' => 'Add-ons for customizing beverages'],
            ['name' => 'Alternative Milk', 'description' => 'Non-dairy milk options'],
            ['name' => 'Beverage', 'description' => 'Canned and bottled drinks'],
            ['name' => 'Food', 'description' => 'Snacks and pastries']
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}
