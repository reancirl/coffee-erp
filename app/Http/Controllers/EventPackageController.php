<?php

namespace App\Http\Controllers;

use App\Models\EventPackage;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class EventPackageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $packages = EventPackage::with('products:id,name')->orderBy('cup_count')->get();

        return Inertia::render('event-packages/Index', [
            'packages' => $packages,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $products = Product::orderBy('name')->get(['id', 'name', 'price']);
        $packages = EventPackage::with('products:id,name')->orderBy('name')->get(['id', 'name']);

        return Inertia::render('event-packages/Create', [
            'products' => $products,
            'packages' => $packages,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'cup_count' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
            'product_ids' => 'array',
            'product_ids.*' => 'exists:products,id',
        ]);

        $validator->after(function ($validator) use ($request) {
            $products = $request->input('product_ids', []);
            $isActive = (bool) $request->input('is_active', false);

            if ($isActive && (empty($products) || ! is_array($products))) {
                $validator->errors()->add('is_active', 'Add at least one product before making the package public.');
            }
        });

        $validated = $validator->validate();
        $products = $validated['product_ids'] ?? [];
        unset($validated['product_ids']);
        $validated['is_active'] = (bool) ($validated['is_active'] ?? false);

        $eventPackage = EventPackage::create($validated);
        $eventPackage->products()->sync($products);

        return redirect()->route('event-packages.index')->with('success', 'Package created.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, EventPackage $eventPackage)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'cup_count' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
            'product_ids' => 'array',
            'product_ids.*' => 'exists:products,id',
        ]);

        $validator->after(function ($validator) use ($request) {
            $products = $request->input('product_ids', []);
            $isActive = (bool) $request->input('is_active', false);

            if ($isActive && (empty($products) || ! is_array($products))) {
                $validator->errors()->add('is_active', 'Add at least one product before making the package public.');
            }
        });

        $validated = $validator->validate();
        $products = $validated['product_ids'] ?? [];
        unset($validated['product_ids']);
        $validated['is_active'] = (bool) ($validated['is_active'] ?? false);

        $eventPackage->update($validated);
        $eventPackage->products()->sync($products);

        return redirect()->route('event-packages.index')->with('success', 'Package updated.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(EventPackage $eventPackage)
    {
        $products = Product::orderBy('name')->get(['id', 'name', 'price']);
        $eventPackage->load('products:id,name,price');

        return Inertia::render('event-packages/Edit', [
            'eventPackage' => $eventPackage,
            'products' => $products,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(EventPackage $eventPackage)
    {
        $eventPackage->delete();

        return redirect()->back()->with('success', 'Package deleted.');
    }
}
