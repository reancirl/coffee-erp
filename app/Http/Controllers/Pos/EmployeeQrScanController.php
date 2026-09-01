<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use App\Support\Allowance;
use App\Support\EmployeeQr;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Resolves a scanned QR for the POS.
 *
 * This is a lookup only. It confirms who the employee is; it authorises
 * nothing. The order endpoint re-resolves the token when the payment is
 * actually taken, so a stale or tampered result here cannot buy coffee.
 */
class EmployeeQrScanController extends Controller
{
    public function resolve(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string|max:255',
        ]);

        $result = EmployeeQr::resolve($validated['token']);
        $resolution = $result['resolution'];

        if (! $resolution->isOk()) {
            // Scans that fail are worth seeing: a burst of them is either a
            // broken printout or someone trying tokens.
            Log::info('Employee QR scan rejected', [
                'resolution' => $resolution->value,
                'cashier_id' => $request->user()?->id,
            ]);

            return response()->json([
                'ok' => false,
                'resolution' => $resolution->value,
                'message' => $result['message'] ?? 'This QR cannot be used.',
            ], 422);
        }

        $employee = $result['user'];

        // Looked up server-side from the ledger. The QR itself still carries
        // nothing but the opaque token.
        $balance = Allowance::balanceFor($employee);

        return response()->json([
            'ok' => true,
            'resolution' => $resolution->value,
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->name,
                'employee_code' => $employee->employee_code,
                'position' => $employee->position,
            ],
            'allowance' => [
                'period' => $balance['label'],
                'amount' => $balance['amount'],
                'used' => $balance['used'],
                'remaining' => $balance['remaining'],
            ],
        ]);
    }
}
