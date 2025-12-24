<?php

namespace App\Http\Controllers;

use App\Models\EventPackage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventPackageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $packages = EventPackage::orderBy('cup_count')->get();

        return Inertia::render('event-packages/Index', [
            'packages' => $packages,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'cup_count' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        EventPackage::create($validated);

        return redirect()->back()->with('success', 'Package created.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, EventPackage $eventPackage)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'cup_count' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $eventPackage->update($validated);

        return redirect()->back()->with('success', 'Package updated.');
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
