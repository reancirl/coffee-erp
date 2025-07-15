<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get category IDs
        $categories = Category::pluck('id', 'name')->toArray();
        
        // Coffee products with hot/iced variants
        $this->seedCoffeeProducts($categories['Coffee'] ?? null);
        
        // Blended Drinks
        $this->seedBlendedDrinks($categories['Blended Drinks'] ?? null);
        
        // River Fizz
        $this->seedRiverFizz($categories['River Fizz'] ?? null);
        
        // Black Trails (Tea)
        $this->seedBlackTrails($categories['Black Trails'] ?? null);
        
        // Greens & Grains
        $this->seedGreensAndGrains($categories['Greens & Grains'] ?? null);
        
        // Add-Ons
        $this->seedAddOns($categories['Add-Ons'] ?? null);
        
        // Alternative Milk
        $this->seedAlternativeMilk($categories['Alternative Milk'] ?? null);
        
        // Beverage (canned and bottled drinks)
        $this->seedBeverage($categories['Beverage'] ?? null);
        
        // Food (snacks and pastries)
        $this->seedFood($categories['Food'] ?? null);
    }
    
    private function seedCoffeeProducts(?int $categoryId): void
    {
        $coffeeProducts = [
            ['name' => 'Espresso', 'prices' => ['hot' => 90, 'iced' => null]],
            ['name' => 'Americano', 'prices' => ['hot' => 125, 'iced' => 125]],
            ['name' => 'Double Americano', 'prices' => ['hot' => 140, 'iced' => 140]],
            ['name' => 'Latte', 'prices' => ['hot' => 145, 'iced' => 145]],
            ['name' => 'Cappuccino', 'prices' => ['hot' => 155, 'iced' => 155]],
            ['name' => 'Caramel Macchiato', 'prices' => ['hot' => 180, 'iced' => 180]],
            ['name' => 'Salted Caramel', 'prices' => ['hot' => 170, 'iced' => 170]],
            ['name' => 'Spanish Latte', 'prices' => ['hot' => 155, 'iced' => 155]],
            ['name' => 'White Mocha', 'prices' => ['hot' => 165, 'iced' => 165]],
            ['name' => 'Mocha', 'prices' => ['hot' => 165, 'iced' => 165]],
            ['name' => 'Biscoff Latte', 'prices' => ['hot' => null, 'iced' => 215]],
            ['name' => 'Dirty Matcha', 'prices' => ['hot' => 190, 'iced' => 190]],
            ['name' => 'Dirty Horchata', 'prices' => ['hot' => 220, 'iced' => 220]]
        ];
        
        foreach ($coffeeProducts as $product) {
            $basePrice = $product['prices']['hot'] ?? $product['prices']['iced'] ?? 0;
            
            // Add customization options for variant (hot/iced)
            $customizations = [
                [
                    'name' => 'Variant',
                    'options' => array_filter([
                        $product['prices']['hot'] !== null ? 'Hot' : null,
                        $product['prices']['iced'] !== null ? 'Iced' : null
                    ]),
                    'required' => true
                ]
            ];
            
            Product::create([
                'name' => $product['name'],
                'price' => $basePrice,
                'category' => $categoryId,
                'prices' => $product['prices'],
                'is_add_on' => false,
                'customizations' => $customizations
            ]);
        }
    }
    
    private function seedBlendedDrinks(?int $categoryId): void
    {
        $blendedDrinks = [
            ['name' => 'Java Chip Frappe', 'price' => 200],
            ['name' => 'Strawberry Milkshake', 'price' => 180],
            ['name' => 'Oreo Milkshake', 'price' => 195],
            ['name' => 'Chocolate Milkshake', 'price' => 205]
        ];
        
        foreach ($blendedDrinks as $drink) {
            Product::create([
                'name' => $drink['name'],
                'price' => $drink['price'],
                'category' => $categoryId,
                'is_add_on' => false
            ]);
        }
    }
    
    private function seedRiverFizz(?int $categoryId): void
    {
        $fizzDrinks = [
            ['name' => 'Green Apple Fizzy', 'price' => 135],
            ['name' => 'Strawberry Fizzy', 'price' => 135],
            ['name' => 'Raspberry Fizzy', 'price' => 135],
            ['name' => 'Passion Fruit Fizzy', 'price' => 135],
            ['name' => 'Kiwi Fizzy', 'price' => 135]
        ];
        
        foreach ($fizzDrinks as $drink) {
            Product::create([
                'name' => $drink['name'],
                'price' => $drink['price'],
                'category' => $categoryId,
                'is_add_on' => false
            ]);
        }
    }
    
    private function seedBlackTrails(?int $categoryId): void
    {
        $teaDrinks = [
            ['name' => 'Green Apple Tea', 'price' => 145],
            ['name' => 'Strawberry Tea', 'price' => 145],
            ['name' => 'Raspberry Tea', 'price' => 145],
            ['name' => 'Passion Fruit Tea', 'price' => 145],
            ['name' => 'Kiwi Tea', 'price' => 145]
        ];
        
        foreach ($teaDrinks as $drink) {
            Product::create([
                'name' => $drink['name'],
                'price' => $drink['price'],
                'category' => $categoryId,
                'is_add_on' => false
            ]);
        }
    }
    
    private function seedGreensAndGrains(?int $categoryId): void
    {
        $greensAndGrains = [
            ['name' => 'Matcha Latte', 'prices' => ['hot' => 160, 'iced' => 160]],
            ['name' => 'Matchata', 'prices' => ['hot' => 210, 'iced' => 210]],
            ['name' => 'Horchata', 'prices' => ['hot' => 175, 'iced' => 175]],
            ['name' => 'Strawberry Matcha', 'prices' => ['hot' => null, 'iced' => 165]],
            ['name' => 'Earl Grey', 'price' => 90],
            ['name' => 'Green Tea', 'price' => 90]
        ];
        
        foreach ($greensAndGrains as $product) {
            if (isset($product['prices'])) {
                $basePrice = $product['prices']['hot'] ?? $product['prices']['iced'] ?? 0;
                
                // Add customization options for variant (hot/iced)
                $customizations = [
                    [
                        'name' => 'Variant',
                        'options' => array_filter([
                            isset($product['prices']['hot']) && $product['prices']['hot'] !== null ? 'Hot' : null,
                            isset($product['prices']['iced']) && $product['prices']['iced'] !== null ? 'Iced' : null
                        ]),
                        'required' => true
                    ]
                ];
                
                Product::create([
                    'name' => $product['name'],
                    'price' => $basePrice,
                    'category' => $categoryId,
                    'prices' => $product['prices'],
                    'is_add_on' => false,
                    'customizations' => $customizations
                ]);
            } else {
                Product::create([
                    'name' => $product['name'],
                    'price' => $product['price'],
                    'category' => $categoryId,
                    'is_add_on' => false
                ]);
            }
        }
    }
    
    private function seedAddOns(?int $categoryId): void
    {
        $addOns = [
            ['name' => 'Espresso', 'price' => 30]
        ];
        
        foreach ($addOns as $addOn) {
            Product::create([
                'name' => $addOn['name'],
                'price' => $addOn['price'],
                'category' => $categoryId,
                'is_add_on' => true
            ]);
        }
    }
    
    private function seedAlternativeMilk(?int $categoryId): void
    {
        $alternativeMilk = [
            ['name' => 'Oat Milk', 'price' => 40]
        ];
        
        foreach ($alternativeMilk as $milk) {
            Product::create([
                'name' => $milk['name'],
                'price' => $milk['price'],
                'category' => $categoryId,
                'is_add_on' => true
            ]);
        }
    }
    
    private function seedBeverage(?int $categoryId): void
    {
        $beverages = [
            ['name' => 'Coke (Can)', 'price' => 75],
            ['name' => 'Red Horse (Can)', 'price' => 120],
            ['name' => 'San Mig (Can)', 'price' => 120],
            ['name' => 'Natures Spring', 'price' => 25]
        ];
        
        foreach ($beverages as $beverage) {
            Product::create([
                'name' => $beverage['name'],
                'price' => $beverage['price'],
                'category' => $categoryId,
                'is_add_on' => false
            ]);
        }
    }
    
    private function seedFood(?int $categoryId): void
    {
        $foodItems = [
            [
                'name' => 'Tapioca', 
                'price' => 130
            ],
            [
                'name' => 'Baked Mac', 
                'price' => 160
            ],
            [
                'name' => 'Cookies', 
                'price' => 120,
                'customizations' => [
                    [
                        'name' => 'Variant',
                        'options' => ['Matcha', 'Chocolate', 'Peanut Butter', 'Red Velvet'],
                        'required' => true
                    ]
                ]
            ]
        ];
        
        foreach ($foodItems as $item) {
            $productData = [
                'name' => $item['name'],
                'price' => $item['price'],
                'category' => $categoryId,
                'is_add_on' => false
            ];
            
            // Add customizations if they exist
            if (isset($item['customizations'])) {
                $productData['customizations'] = $item['customizations'];
            }
            
            Product::create($productData);
        }
    }
}
