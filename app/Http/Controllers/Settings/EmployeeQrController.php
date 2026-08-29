<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
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
        ]);
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
