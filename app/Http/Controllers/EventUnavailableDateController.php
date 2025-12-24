<?php

namespace App\Http\Controllers;

use App\Models\EventUnavailableDate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventUnavailableDateController extends Controller
{
    /**
     * Display a listing of unavailable dates.
     */
    public function index()
    {
        $dates = EventUnavailableDate::orderBy('unavailable_date')->get();

        return Inertia::render('event-unavailable-dates/Index', [
            'dates' => $dates,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'unavailable_date' => 'required|date|unique:event_unavailable_dates,unavailable_date',
            'reason' => 'nullable|string|max:255',
        ]);

        EventUnavailableDate::create($validated);

        return redirect()->back()->with('success', 'Date blocked.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(EventUnavailableDate $eventUnavailableDate)
    {
        $eventUnavailableDate->delete();

        return redirect()->back()->with('success', 'Date unblocked.');
    }
}
