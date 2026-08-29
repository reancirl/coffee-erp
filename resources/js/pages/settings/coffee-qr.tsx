import { Head } from '@inertiajs/react';
import { Coffee, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SettingsLayout from '@/layouts/settings/layout';

interface LedgerEntry {
    id: number;
    type: string;
    signed_amount: string;
    description: string | null;
    order_number: string | null;
    recorded_at: string | null;
}

interface AllowanceSummary {
    period: string;
    amount: number;
    used: number;
    remaining: number;
    transactions: LedgerEntry[];
}

const peso = (amount: number): string =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

const TYPE_LABELS: Record<string, string> = {
    redeem: 'Redeem',
    reversal: 'Reversal',
    adjustment: 'Adjustment',
};

interface Props {
    employee: {
        name: string;
        employee_code: string | null;
        position: string | null;
        eligible: boolean;
        ineligibility_reason: string | null;
    };
    qr: { issued_at: string | null } | null;
    allowance: AllowanceSummary | null;
}

export default function CoffeeQr({ employee, qr, allowance }: Props) {
    // The image is fetched from an authenticated endpoint; the raw token is
    // never present in this page's props.
    const imageUrl = '/settings/coffee-qr/image';

    const print = () => {
        const win = window.open('', '_blank', 'width=420,height=620');
        if (!win) return;

        win.document.write(`
            <html>
                <head>
                    <title>Coffee Allowance QR - ${employee.employee_code ?? ''}</title>
                    <style>
                        body { font-family: system-ui, sans-serif; text-align: center; padding: 32px; }
                        img { width: 260px; height: 260px; }
                        .name { font-size: 18px; font-weight: 600; margin-top: 12px; }
                        .code { font-family: ui-monospace, monospace; font-size: 15px; color: #444; }
                        .position { font-size: 13px; color: #666; }
                    </style>
                </head>
                <body>
                    <img src="${imageUrl}" alt="Coffee allowance QR" />
                    <div class="name">${employee.name}</div>
                    <div class="code">${employee.employee_code ?? ''}</div>
                    <div class="position">${employee.position ?? ''}</div>
                </body>
            </html>
        `);
        win.document.close();

        // Wait for the QR image to load before opening the print dialog,
        // otherwise the sheet prints blank.
        const img = win.document.querySelector('img');
        const go = () => {
            win.focus();
            win.print();
        };
        if (img && !img.complete) {
            img.addEventListener('load', go);
            img.addEventListener('error', go);
        } else {
            go();
        }
    };

    return (
        <>
            <Head title="Coffee QR" />
            <SettingsLayout>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Coffee className="h-5 w-5" />
                            Coffee allowance QR
                        </CardTitle>
                        <CardDescription>Present this at the counter to redeem your coffee allowance.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        {!employee.eligible && (
                            <p className="w-full rounded-md bg-amber-50 p-3 text-sm text-amber-700">
                                {employee.ineligibility_reason ?? 'You are not currently eligible for the coffee allowance.'}
                            </p>
                        )}

                        {qr === null ? (
                            <p className="py-8 text-center text-sm text-gray-500">
                                No QR has been issued to you yet. Ask an administrator to generate one.
                            </p>
                        ) : (
                            <>
                                <div className="rounded-lg border bg-white p-4">
                                    <img src={imageUrl} alt="Your coffee allowance QR code" className="h-56 w-56" />
                                </div>

                                <div className="text-center">
                                    <div className="text-base font-semibold">{employee.name}</div>
                                    {employee.employee_code && (
                                        <div className="font-mono text-sm text-gray-600">{employee.employee_code}</div>
                                    )}
                                    {employee.position && <div className="text-xs text-gray-500">{employee.position}</div>}
                                </div>

                                <Button onClick={print} variant="outline">
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print QR
                                </Button>

                                {qr.issued_at && <p className="text-xs text-gray-400">Issued {qr.issued_at}</p>}

                                <p className="text-center text-xs text-gray-400">
                                    Lost this code? Ask an administrator to reissue it — the old one stops working immediately.
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                {allowance && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{allowance.period} allowance</CardTitle>
                            <CardDescription>Every redemption against this month's allowance.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="rounded-md border p-3">
                                    <div className="text-xs text-gray-500">Allowance</div>
                                    <div className="font-semibold">{peso(allowance.amount)}</div>
                                </div>
                                <div className="rounded-md border p-3">
                                    <div className="text-xs text-gray-500">Used</div>
                                    <div className="font-semibold">{peso(allowance.used)}</div>
                                </div>
                                <div className="rounded-md border p-3">
                                    <div className="text-xs text-gray-500">Remaining</div>
                                    <div
                                        className={
                                            allowance.remaining <= 0 ? 'font-semibold text-red-600' : 'font-semibold text-green-700'
                                        }
                                    >
                                        {peso(allowance.remaining)}
                                    </div>
                                </div>
                            </div>

                            {allowance.transactions.length === 0 ? (
                                <p className="py-4 text-center text-sm text-gray-500">
                                    No redemptions yet this month.
                                </p>
                            ) : (
                                <ul className="divide-y text-sm">
                                    {allowance.transactions.map((entry) => (
                                        <li key={entry.id} className="flex items-start justify-between gap-3 py-2">
                                            <div>
                                                <div className="font-medium">
                                                    {TYPE_LABELS[entry.type] ?? entry.type}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {entry.order_number ?? entry.description ?? '—'}
                                                </div>
                                                {entry.recorded_at && (
                                                    <div className="text-xs text-gray-400">{entry.recorded_at}</div>
                                                )}
                                            </div>
                                            <div
                                                className={
                                                    entry.signed_amount.startsWith('-')
                                                        ? 'font-mono text-red-600'
                                                        : 'font-mono text-green-700'
                                                }
                                            >
                                                ₱{entry.signed_amount}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                )}
            </SettingsLayout>
        </>
    );
}
