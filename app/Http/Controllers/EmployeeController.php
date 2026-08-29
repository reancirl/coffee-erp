<?php

namespace App\Http\Controllers;

use App\Enums\EmploymentStatus;
use App\Models\User;
use App\Support\EmployeeCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    /**
     * Employee directory, driven by real users.
     */
    public function index(Request $request)
    {
        $query = User::query()->orderBy('name');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('employee_code', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('eligible_only')) {
            $query->allowanceEligible();
        }

        $employees = $query->paginate(30)->withQueryString();

        return Inertia::render('employees/index', [
            'employees' => [
                'data' => $employees->getCollection()->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'employee_code' => $user->employee_code,
                    'position' => $user->position,
                    'employment_status' => $user->employment_status->value,
                    'allowance_eligible' => $user->allowance_eligible,
                    'can_redeem_allowance' => $user->canRedeemAllowance(),
                    'ineligibility_reason' => $user->allowanceIneligibilityReason(),
                ]),
                'meta' => [
                    'current_page' => $employees->currentPage(),
                    'last_page' => $employees->lastPage(),
                    'total' => $employees->total(),
                ],
            ],
            'filters' => [
                'search' => $request->search,
                'eligible_only' => $request->boolean('eligible_only'),
            ],
            'statuses' => EmploymentStatus::values(),
        ]);
    }

    /**
     * Update employment details and allowance eligibility.
     *
     * Marking someone eligible issues their employee code if they lack one.
     * Eligibility is never revoked implicitly — only by an explicit change here.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'position' => 'nullable|string|max:100',
            'employment_status' => ['required', Rule::in(EmploymentStatus::values())],
            'allowance_eligible' => 'required|boolean',
        ]);

        DB::transaction(function () use ($user, $validated) {
            $user->fill([
                'position' => $validated['position'] ?? null,
                'employment_status' => $validated['employment_status'],
                'allowance_eligible' => $validated['allowance_eligible'],
            ])->save();

            // A code is issued on eligibility and then kept for good, even if
            // eligibility is later withdrawn: past transactions still refer to
            // this person, and reusing the number would corrupt that history.
            if ($validated['allowance_eligible']) {
                EmployeeCode::assignTo($user);
            }
        });

        return redirect()->back()->with('success', "{$user->name} updated.");
    }
}
