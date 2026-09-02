import AppLayout, { withAppShell } from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Coffee, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Coffee Allowance',
        href: '/coffee-allowance',
    },
];

const peso = (amount: number): string =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

const TYPE_LABELS: Record<string, string> = {
    redeem: 'Redeem',
    reversal: 'Reversal',
    adjustment: 'Adjustment',
};

export default function CoffeeAllowance({ employee, qr, allowance }: Props) {
    // Fetched from an authenticated endpoint; the raw token is never in props.
    const imageUrl = '/coffee-allowance/qr';

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

    const spent = allowance && allowance.amount > 0 ? Math.min(allowance.used / allowance.amount, 1) : 0;
    const depleted = allowance !== null && allowance.remaining <= 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Coffee Allowance" />

            <div className="flex flex-col gap-6 p-6">
                <header className="flex flex-col gap-1">
                    <h1 className="flex items-center gap-2 text-2xl font-bold">
                        <Coffee className="h-6 w-6" />
                        Coffee Allowance
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Show your QR at the counter. Everything you redeem this month is listed here.
                    </p>
                </header>

                {!employee.eligible && (
                    <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                        {employee.ineligibility_reason ?? 'You are not currently eligible for the coffee allowance.'}
                    </p>
                )}

                <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start">
                    {/* ---------- credential ---------- */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Your QR</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-4">
                            {qr === null ? (
                                <p className="py-10 text-center text-sm text-muted-foreground">
                                    No QR has been issued to you yet. Ask an administrator to generate one.
                                </p>
                            ) : (
                                <>
                                    {/* Deliberately white in both themes: scanners need
                                        the dark-on-light contrast to read the code. */}
                                    <div className="rounded-lg border bg-card p-4">
                                        <img
                                            src={imageUrl}
                                            alt="Your coffee allowance QR code"
                                            className="h-52 w-52"
                                        />
                                    </div>

                                    <div className="text-center">
                                        <div className="text-base font-semibold">{employee.name}</div>
                                        {employee.employee_code && (
                                            <div className="font-mono text-sm text-muted-foreground">
                                                {employee.employee_code}
                                            </div>
                                        )}
                                        {employee.position && (
                                            <div className="text-xs text-muted-foreground">{employee.position}</div>
                                        )}
                                    </div>

                                    <Button onClick={print} variant="outline" className="w-full">
                                        <Printer className="mr-2 h-4 w-4" />
                                        Print QR
                                    </Button>

                                    <p className="text-center text-xs text-muted-foreground">
                                        {qr.issued_at && <>Issued {qr.issued_at}. </>}
                                        Lost it? An administrator can reissue &mdash; the old one stops working
                                        immediately.
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* ---------- balance and ledger ---------- */}
                    {allowance === null ? (
                        <Card>
                            <CardContent className="py-12 text-center text-sm text-muted-foreground">
                                No allowance period is open for you.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="flex flex-col gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between gap-2">
                                    <CardTitle className="text-base">{allowance.period}</CardTitle>
                                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                                        This month
                                    </span>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                        <div className="min-w-0 rounded-md border p-2.5 sm:p-3">
                                            <div className="truncate text-xs text-muted-foreground">Allowance</div>
                                            <div className="mt-1 break-words text-sm font-semibold tabular-nums sm:text-lg">
                                                {peso(allowance.amount)}
                                            </div>
                                        </div>
                                        <div className="min-w-0 rounded-md border p-2.5 sm:p-3">
                                            <div className="truncate text-xs text-muted-foreground">Used</div>
                                            <div className="mt-1 break-words text-sm font-semibold tabular-nums sm:text-lg">
                                                {peso(allowance.used)}
                                            </div>
                                        </div>
                                        <div className="min-w-0 rounded-md border p-2.5 sm:p-3">
                                            <div className="truncate text-xs text-muted-foreground">Remaining</div>
                                            <div
                                                className={`mt-1 break-words text-sm font-semibold tabular-nums sm:text-lg ${
                                                    depleted
                                                        ? 'text-destructive'
                                                        : 'text-emerald-700 dark:text-emerald-400'
                                                }`}
                                            >
                                                {peso(allowance.remaining)}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div
                                            className="h-2 w-full overflow-hidden rounded-full bg-muted"
                                            role="progressbar"
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                            aria-valuenow={Math.round(spent * 100)}
                                            aria-label="Allowance used"
                                        >
                                            <div
                                                className={`h-full rounded-full ${
                                                    depleted ? 'bg-destructive' : 'bg-emerald-600 dark:bg-emerald-500'
                                                }`}
                                                style={{ width: `${spent * 100}%` }}
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {depleted
                                                ? 'You have used your whole allowance for this month.'
                                                : `${peso(allowance.remaining)} left of ${peso(allowance.amount)}.`}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Redemptions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {allowance.transactions.length === 0 ? (
                                        <p className="py-8 text-center text-sm text-muted-foreground">
                                            Nothing redeemed yet this month.
                                        </p>
                                    ) : (
                                        <ul className="divide-y text-sm">
                                            {allowance.transactions.map((entry) => (
                                                <li
                                                    key={entry.id}
                                                    className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="font-medium">
                                                            {TYPE_LABELS[entry.type] ?? entry.type}
                                                        </div>
                                                        <div className="truncate text-xs text-muted-foreground">
                                                            {entry.order_number ?? entry.description ?? '—'}
                                                        </div>
                                                        {entry.recorded_at && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {entry.recorded_at}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div
                                                        className={`shrink-0 font-mono tabular-nums ${
                                                            entry.signed_amount.startsWith('-')
                                                                ? 'text-destructive'
                                                                : 'text-emerald-700 dark:text-emerald-400'
                                                        }`}
                                                    >
                                                        ₱{entry.signed_amount}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

CoffeeAllowance.layout = withAppShell;
