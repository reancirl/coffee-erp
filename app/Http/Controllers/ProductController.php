<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
    
    /**
     * Get products organized by category for the POS system
     */
    public function getProductsForPOS()
    {
        // Cache the products for 10 minutes to improve performance
        return Cache::remember('pos_products', 600, function () {
            // Get all categories
            $categories = Category::all();
            
            // Get all products with their categories
            $products = Product::all();
            
            // Organize products by category
            $menuData = [];
            
            foreach ($categories as $category) {
                // Skip categories with no products
                $categoryProducts = $products->where('category', $category->id)->values();
                
                if ($categoryProducts->isEmpty()) {
                    continue;
                }
                
                // Format products according to the data.ts structure
                $formattedProducts = $categoryProducts->map(function ($product) {
                    $data = [
                        'name' => $product->name,
                        'type' => $product->is_add_on ? 'addon' : 'product'
                    ];
                    
                    // Handle prices based on whether it has variants
                    if ($product->prices) {
                        $data['prices'] = $product->prices;
                    } else {
                        $data['price'] = $product->price;
                    }
                    
                    return $data;
                })->toArray();
                
                $menuData[$category->name] = $formattedProducts;
            }
            
            return [
                'menuData' => $menuData
            ];
        });
    }
}
