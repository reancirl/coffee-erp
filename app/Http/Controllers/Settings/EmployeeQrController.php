<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\AllowanceTransaction;
use App\Support\Allowance;
use App\Support\QrImage;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Employee self-service: view and print your own coffee allowance QR.
 *
 * Strictly scoped to the authenticated user — there is no route here that can
 * render somebody else's credential.
 */
class EmployeeQrController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        $credential = $user->activeQrCredential();

        return Inertia::render('settings/coffee-qr', [
            'employee' => [
                'name' => $user->name,
                'employee_code' => $user->employee_code,
                'position' => $user->position,
                'eligible' => $user->canRedeemAllowance(),
                'ineligibility_reason' => $user->allowanceIneligibilityReason(),
            ],
            'qr' => $credential === null ? null : [
                'issued_at' => $credential->issued_at?->toDayDateTimeString(),
            ],
            'allowance' => $this->allowanceSummary($user),
        ]);
    }

    /**
     * The employee's own balance and the movements behind it, so "why do I
     * only have P550?" is answerable without asking an admin.
     *
     * @return array<string, mixed>|null
     */
    private function allowanceSummary($user): ?array
    {
        $balance = Allowance::balanceFor($user);

        if ($balance['period'] === null) {
            return null;
        }

        return [
            'period' => $balance['label'],
            'amount' => $balance['amount'],
            'used' => $balance['used'],
            'remaining' => $balance['remaining'],
            'transactions' => $balance['period']->transactions()
                ->with('order:id,order_number')
                ->latest('id')
                ->get()
                ->map(fn (AllowanceTransaction $t) => [
                    'id' => $t->id,
                    'type' => $t->type,
                    'signed_amount' => $t->signed_amount,
                    'description' => $t->description,
                    'order_number' => $t->order?->order_number,
                    'recorded_at' => $t->created_at?->toDayDateTimeString(),
                ]),
        ];
    }

    public function image(Request $request)
    {
        $credential = $request->user()->activeQrCredential();

        abort_if($credential === null, 404, 'You have no active QR.');

        return response(QrImage::svg($credential->token), 200, [
            'Content-Type' => 'image/svg+xml',
            'Cache-Control' => 'no-store, private',
        ]);
    }
}
