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
    public function index(Request $request)
    {
        $query = Product::with('categoryRelation');
        
        // Search functionality
        if ($request->filled('search')) {
            $searchTerm = $request->get('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                  ->orWhereHas('categoryRelation', function ($categoryQuery) use ($searchTerm) {
                      $categoryQuery->where('name', 'like', '%' . $searchTerm . '%');
                  });
            });
        }
        
        // Category filter
        if ($request->filled('category')) {
            $query->where('category', $request->get('category'));
        }
        
        // Type filter (product vs add-on)
        if ($request->filled('type')) {
            $isAddOn = $request->get('type') === 'add-on';
            $query->where('is_add_on', $isAddOn);
        }
        
        $products = $query->orderBy('name')->paginate(20)->withQueryString();
        
        // Get categories for filter dropdown
        $categories = Category::orderBy('name')->get();
            
        return inertia('products/Index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'type'])
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $categories = Category::orderBy('name')->get();
        
        return inertia('products/Form', [
            'categories' => $categories
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category' => 'nullable|exists:categories,id',
            'prices' => 'nullable|array',
            'prices.hot' => 'nullable|numeric|min:0',
            'prices.iced' => 'nullable|numeric|min:0',
            'is_add_on' => 'boolean',
            'customizations' => 'nullable|array',
        ]);

        // Ensure at least one price is provided for non-add-ons
        if (!$validated['is_add_on'] && empty($validated['price']) && 
            (empty($validated['prices']['hot']) && empty($validated['prices']['iced']))) {
            return back()->withErrors(['price' => 'At least one price must be provided.']);
        }

        Product::create($validated);

        return redirect()->route('products.index')
            ->with('success', 'Product created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product)
    {
        $product->load('categoryRelation');
        
        return inertia('products/Show', [
            'product' => $product
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Product $product)
    {
        $categories = Category::orderBy('name')->get();
        
        return inertia('products/Form', [
            'product' => $product,
            'categories' => $categories
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category' => 'nullable|exists:categories,id',
            'prices' => 'nullable|array',
            'prices.hot' => 'nullable|numeric|min:0',
            'prices.iced' => 'nullable|numeric|min:0',
            'is_add_on' => 'boolean',
            'customizations' => 'nullable|array',
        ]);

        // Ensure at least one price is provided for non-add-ons
        if (!$validated['is_add_on'] && empty($validated['price']) && 
            (empty($validated['prices']['hot']) && empty($validated['prices']['iced']))) {
            return back()->withErrors(['price' => 'At least one price must be provided.']);
        }

        $product->update($validated);

        return redirect()->route('products.index')
            ->with('success', 'Product updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product)
    {
        $product->delete();

        return redirect()->route('products.index')
            ->with('success', 'Product deleted successfully.');
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
                        'type' => $product->is_add_on ? 'addon' : 'product',
                        'id' => $product->id,
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
