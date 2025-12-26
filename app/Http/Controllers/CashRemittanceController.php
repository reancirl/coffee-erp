<?php

namespace App\Http\Controllers;

use App\Models\CashRemittance;
use App\Models\SalesMonitoring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CashRemittanceController extends Controller
{
    public function store(Request $request, SalesMonitoring $salesMonitoring)
    {
        $validated = $request->validate([
            'destination' => 'required|string|max:255',
            'method' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0.01',
            'reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
            'attachment' => 'nullable|file|max:4096',
        ]);

        if ($validated['amount'] > $salesMonitoring->calculateExpectedBalance()) {
            return redirect()->back()->withErrors(['amount' => 'Remittance exceeds available cash for this shift.'])->withInput();
        }

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('remittances', 'public');
        }

        $remittance = CashRemittance::create([
            ...$validated,
            'attachment_path' => $attachmentPath,
            'status' => 'pending',
            'sales_monitoring_id' => $salesMonitoring->id,
            'created_by' => auth()->id(),
        ]);

        // Decrease expected balance via cash_out
        $salesMonitoring->update([
            'cash_out' => $salesMonitoring->cash_out + $validated['amount'],
            'cash_out_notes' => trim(($salesMonitoring->cash_out_notes ?? '') . "\n" . now()->format('H:i') . ": Remit ₱" . number_format($validated['amount'], 2) . " to {$validated['destination']} ({$validated['method']})"),
            'expected_balance' => $salesMonitoring->calculateExpectedBalance(),
        ]);

        return redirect()->back()->with('success', 'Remittance logged.');
    }

    public function confirm(CashRemittance $cashRemittance)
    {
        if ($cashRemittance->status === 'confirmed') {
            return redirect()->back()->with('success', 'Remittance already confirmed.');
        }

        $cashRemittance->update([
            'status' => 'confirmed',
            'confirmed_at' => now(),
            'confirmed_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Remittance confirmed and locked.');
    }
}
