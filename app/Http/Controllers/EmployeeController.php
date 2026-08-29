<?php

namespace App\Http\Controllers;

use App\Enums\EmploymentStatus;
use App\Models\User;
use App\Models\AllowanceTransaction;
use App\Support\Allowance;
use App\Support\EmployeeCode;
use App\Support\EmployeeQr;
use App\Support\QrImage;
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
                    'has_qr' => $user->activeQrCredential() !== null,
                    'qr_issued_at' => $user->activeQrCredential()?->issued_at?->toDayDateTimeString(),
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

    /**
     * The employee's QR as an SVG image.
     *
     * Served as an image so the raw token never has to travel in page props.
     */
    public function qr(User $user)
    {
        $credential = $user->activeQrCredential();

        abort_if($credential === null, 404, 'This employee has no active QR.');

        return response($credential->token ? QrImage::svg($credential->token) : '', 200, [
            'Content-Type' => 'image/svg+xml',
            // A QR is a credential: never let a shared cache hold on to it.
            'Cache-Control' => 'no-store, private',
        ]);
    }

    /**
     * Issue (or reissue) the employee's QR. Any previous QR stops working.
     */
    public function issueQr(Request $request, User $user)
    {
        if (! $user->canRedeemAllowance()) {
            return back()->withErrors([
                'qr' => $user->allowanceIneligibilityReason() ?? 'This employee cannot hold an allowance QR.',
            ]);
        }

        EmployeeQr::issueFor($user, $request->user());

        return back()->with('success', "New QR issued for {$user->name}. Any previous QR no longer works.");
    }

    /**
     * The employee's allowance ledger: current period, balance and every
     * movement behind it. This is the answer to "why do I only have P550?".
     */
    public function allowance(User $user)
    {
        $balance = Allowance::balanceFor($user);

        return response()->json([
            'employee' => [
                'id' => $user->id,
                'name' => $user->name,
                'employee_code' => $user->employee_code,
            ],
            'period' => $balance['label'],
            'amount' => $balance['amount'],
            'used' => $balance['used'],
            'remaining' => $balance['remaining'],
            'can_adjust' => request()->user()->canAdjustAllowances(),
            'transactions' => $balance['period'] === null ? [] : $balance['period']
                ->transactions()
                ->with('order:id,order_number')
                ->latest('id')
                ->get()
                ->map(fn (AllowanceTransaction $t) => [
                    'id' => $t->id,
                    'type' => $t->type,
                    'amount' => (float) $t->amount,
                    'signed_amount' => $t->signed_amount,
                    'description' => $t->description,
                    'order_number' => $t->order?->order_number,
                    'recorded_at' => $t->created_at?->toDayDateTimeString(),
                ]),
            'history' => Allowance::historyFor($user)->map(fn ($p) => [
                'label' => $p->label,
                'amount' => (float) $p->amount,
                'used' => $p->used(),
                'remaining' => $p->remaining(),
            ]),
        ]);
    }

    /**
     * Post a manual adjustment against the employee's current period.
     */
    public function adjustAllowance(Request $request, User $user)
    {
        if (! $request->user()->canAdjustAllowances()) {
            abort(403, 'You are not authorised to adjust allowances.');
        }

        $validated = $request->validate([
            // Signed: negative claws back, positive tops up.
            'amount' => 'required|numeric|not_in:0',
            'reason' => 'required|string|max:255',
        ]);

        $transaction = Allowance::adjust(
            $user,
            (float) $validated['amount'],
            $request->user(),
            $validated['reason'],
        );

        if ($transaction === null) {
            return back()->withErrors(['allowance' => 'This employee has no active allowance period to adjust.']);
        }

        return back()->with('success', "Adjustment of {$transaction->signed_amount} recorded for {$user->name}.");
    }

    /**
     * Revoke the employee's QR without issuing a replacement.
     */
    public function revokeQr(Request $request, User $user)
    {
        $revoked = EmployeeQr::revokeFor($user, $request->user());

        return back()->with('success', $revoked > 0
            ? "QR revoked for {$user->name}."
            : "{$user->name} had no active QR.");
    }
}
