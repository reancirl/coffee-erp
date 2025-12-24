<?php

namespace App\Http\Controllers;

use App\Models\EventBooking;
use App\Models\EventPackage;
use App\Models\EventUnavailableDate;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventBookingController extends Controller
{
    /**
     * Public landing / stepper.
     */
    public function landing()
    {
        [$packages, $blockedDates] = $this->getFormData();

        return Inertia::render('welcome', [
            'packages' => $packages,
            'blockedDates' => $blockedDates,
            'today' => Carbon::today()->format('Y-m-d'),
        ]);
    }

    /**
     * Public booking submission.
     */
    public function storePublic(Request $request)
    {
        $validated = $this->validateBooking($request, false);

        if ($blockedReason = $this->dateIsBlocked($validated['event_date'])) {
            return redirect()->back()->withErrors(['event_date' => $blockedReason])->withInput();
        }

        EventBooking::create([
            ...$validated,
            'status' => EventBooking::STATUS_PENDING,
        ]);

        return redirect()->back()->with('success', 'Thanks! Your coffee cart booking request is in. We will confirm availability shortly.');
    }

    /**
     * Admin: list bookings.
     */
    public function index(Request $request)
    {
        $bookings = EventBooking::with('package')
            ->when($request->get('status'), function ($query, $status) {
                $query->where('status', $status);
            })
            ->orderBy('event_date')
            ->paginate(20)
            ->withQueryString();

        [$packages] = $this->getFormData(false);

        return Inertia::render('event-bookings/Index', [
            'bookings' => $bookings,
            'packages' => $packages,
            'filters' => [
                'status' => $request->get('status'),
            ],
            'statuses' => $this->statuses(),
        ]);
    }

    /**
     * Admin: edit booking.
     */
    public function edit(EventBooking $eventBooking)
    {
        [$packages] = $this->getFormData(false);

        return Inertia::render('event-bookings/Edit', [
            'booking' => $eventBooking,
            'packages' => $packages,
            'statuses' => $this->statuses(),
        ]);
    }

    /**
     * Admin: show create form.
     */
    public function create()
    {
        [$packages] = $this->getFormData(false);

        return Inertia::render('event-bookings/Create', [
            'packages' => $packages,
            'statuses' => $this->statuses(),
        ]);
    }

    /**
     * Admin: create booking.
     */
    public function store(Request $request)
    {
        $validated = $this->validateBooking($request, true);

        if ($blockedReason = $this->dateIsBlocked($validated['event_date'])) {
            return redirect()->back()->withErrors(['event_date' => $blockedReason])->withInput();
        }

        EventBooking::create($validated);

        return redirect()->back()->with('success', 'Booking created.');
    }

    /**
     * Admin: update booking (status or details).
     */
    public function update(Request $request, EventBooking $eventBooking)
    {
        $validated = $this->validateBooking($request, true, $eventBooking->id);

        if (
            $validated['event_date'] !== $eventBooking->event_date?->format('Y-m-d') &&
            ($blockedReason = $this->dateIsBlocked($validated['event_date'], $eventBooking->id))
        ) {
            return redirect()->back()->withErrors(['event_date' => $blockedReason])->withInput();
        }

        $eventBooking->update($validated);

        return redirect()->back()->with('success', 'Booking updated.');
    }

    /**
     * Public + admin availability feed.
     */
    public function availability()
    {
        [, $blockedDates] = $this->getFormData();

        return response()->json([
            'blockedDates' => $blockedDates,
        ]);
    }

    /**
     * Gather packages and blocked dates.
     */
    private function getFormData(bool $onlyActivePackages = true): array
    {
        $packagesQuery = EventPackage::orderBy('cup_count');

        if ($onlyActivePackages) {
            $packagesQuery->where('is_active', true);
        }

        $packages = $packagesQuery->get();

        $blockedDates = EventUnavailableDate::pluck('unavailable_date')
            ->merge(
                EventBooking::where('status', '!=', EventBooking::STATUS_CANCELLED)->pluck('event_date')
            )
            ->unique()
            ->map(fn ($date) => Carbon::parse($date)->format('Y-m-d'))
            ->values();

        return [$packages, $blockedDates];
    }

    /**
     * Check if a date is blocked.
     */
    private function dateIsBlocked(string $date, ?int $ignoreBookingId = null): ?string
    {
        $isUnavailable = EventUnavailableDate::whereDate('unavailable_date', $date)->exists();

        if ($isUnavailable) {
            return 'Sorry, that date is blocked off.';
        }

        $hasBooking = EventBooking::whereDate('event_date', $date)
            ->where('status', '!=', EventBooking::STATUS_CANCELLED)
            ->when($ignoreBookingId, fn ($query) => $query->where('id', '!=', $ignoreBookingId))
            ->exists();

        if ($hasBooking) {
            return 'That date already has a booking on the calendar.';
        }

        return null;
    }

    /**
     * Shared validation rules.
     */
    private function validateBooking(Request $request, bool $isAdmin, ?int $bookingId = null): array
    {
        $rules = [
            'event_package_id' => 'nullable|exists:event_packages,id',
            'event_date' => 'required|date',
            'event_start_time' => 'nullable|date_format:H:i',
            'duration_minutes' => 'nullable|integer|min:30|max:1440',
            'event_name' => 'required|string|max:255',
            'event_type' => 'nullable|string|max:255',
            'venue_address' => 'required|string|max:2000',
            'contact_name' => 'required|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'expected_guests' => 'nullable|integer|min:1',
            'notes' => 'nullable|string',
        ];

        if ($isAdmin) {
            $rules['status'] = 'required|string|in:' . implode(',', $this->statuses());
        }

        $validated = $request->validate($rules);

        if (empty($validated['contact_email']) && empty($validated['contact_phone'])) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'contact_email' => 'Provide either an email or phone number so we can reach out.',
                'contact_phone' => 'Provide either an email or phone number so we can reach out.',
            ]);
        }

        if (!$isAdmin) {
            $validated['status'] = EventBooking::STATUS_PENDING;
        }

        return $validated;
    }

    private function statuses(): array
    {
        return [
            EventBooking::STATUS_PENDING,
            EventBooking::STATUS_RESERVED,
            EventBooking::STATUS_CONFIRMED,
            EventBooking::STATUS_CANCELLED,
        ];
    }
}
