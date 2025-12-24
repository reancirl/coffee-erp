<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Inertia\Inertia;

class PublicMenuController extends Controller
{
    public function index()
    {
        $displayOrder = [
            'Coffee',
            'Greens & Grains',
            'Black Trails',
            'Blended Drinks',
            'River Fizz',
        ];

        $categories = Category::whereIn('name', $displayOrder)
            ->get()
            ->map(function ($category) {
                $products = Product::where('category', $category->id)
                    ->where('is_add_on', false)
                    ->orderBy('name')
                    ->get(['id', 'name', 'price', 'prices', 'is_add_on', 'customizations']);

                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'description' => $category->description,
                    'products' => $products,
                ];
            })
            ->filter(fn ($category) => $category['products']->isNotEmpty())
            ->sortBy(function ($category) use ($displayOrder) {
                return array_search($category['name'], $displayOrder);
            })
            ->values();

        return Inertia::render('menu', [
            'categories' => $categories,
        ]);
    }
}
