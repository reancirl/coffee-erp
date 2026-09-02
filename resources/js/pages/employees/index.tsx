import AppLayout, { withAppShell } from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCog, Search, Coffee, QrCode, Printer, Ban, Receipt } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employee Management',
        href: '/employees',
    },
];

interface Employee {
    id: number;
    name: string;
    email: string;
    employee_code: string | null;
    position: string | null;
    employment_status: string;
    allowance_eligible: boolean;
    has_allowance_role: boolean;
    can_redeem_allowance: boolean;
    ineligibility_reason: string | null;
    has_qr: boolean;
    qr_issued_at: string | null;
}

interface Props {
    employees: {
        data: Employee[];
        meta: { current_page: number; last_page: number; total: number };
    };
    filters: { search?: string; eligible_only?: boolean };
    statuses: string[];
    allowance_role: string;
}

interface LedgerEntry {
    id: number;
    type: string;
    signed_amount: string;
    description: string | null;
    order_number: string | null;
    recorded_at: string | null;
}

interface Ledger {
    employee: { id: number; name: string; employee_code: string | null };
    period: string | null;
    amount: number;
    used: number;
    remaining: number;
    can_adjust: boolean;
    transactions: LedgerEntry[];
    history: { label: string; amount: number; used: number; remaining: number }[];
}

const peso = (amount: number): string =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

const TYPE_LABELS: Record<string, string> = {
    redeem: 'Redeem',
    reversal: 'Reversal',
    adjustment: 'Adjustment',
};

const initials = (name: string) =>
    name
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

export default function Index({ employees, filters, statuses, allowance_role }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [editing, setEditing] = useState<Employee | null>(null);
    const [qrFor, setQrFor] = useState<Employee | null>(null);
    const [qrBusy, setQrBusy] = useState(false);
    // Bumped after issue/revoke so the <img> refetches instead of showing a
    // stale credential.
    const [qrVersion, setQrVersion] = useState(0);
    const [ledger, setLedger] = useState<Ledger | null>(null);
    const [ledgerLoading, setLedgerLoading] = useState(false);
    const [adjustAmount, setAdjustAmount] = useState('');
    const [adjustReason, setAdjustReason] = useState('');

    // Draft state for the edit dialog.
    const [position, setPosition] = useState('');
    const [status, setStatus] = useState('active');
    const [eligible, setEligible] = useState(false);
    const [saving, setSaving] = useState(false);

    const applyFilters = (overrides: Record<string, unknown> = {}) => {
        router.get(
            '/employees',
            { search: search || undefined, eligible_only: filters.eligible_only || undefined, ...overrides },
            { preserveState: true, replace: true },
        );
    };

    const openEditor = (employee: Employee) => {
        setEditing(employee);
        setPosition(employee.position ?? '');
        setStatus(employee.employment_status);
        setEligible(employee.allowance_eligible);
    };

    const openLedger = async (employee: Employee) => {
        setLedgerLoading(true);
        setLedger(null);
        setAdjustAmount('');
        setAdjustReason('');
        try {
            const response = await fetch(`/employees/${employee.id}/allowance`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            setLedger(await response.json());
        } finally {
            setLedgerLoading(false);
        }
    };

    const submitAdjustment = () => {
        if (!ledger) return;
        router.post(
            `/employees/${ledger.employee.id}/allowance/adjust`,
            { amount: adjustAmount, reason: adjustReason },
            {
                preserveScroll: true,
                onSuccess: () => {
                    const employee = employees.data.find((e) => e.id === ledger.employee.id);
                    if (employee) void openLedger(employee);
                },
            },
        );
    };

    const issueQr = (employee: Employee) => {
        setQrBusy(true);
        router.post(
            `/employees/${employee.id}/qr`,
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setQrBusy(false);
                    setQrVersion((v) => v + 1);
                },
                onSuccess: () => setQrFor({ ...employee, has_qr: true }),
            },
        );
    };

    const revokeQr = (employee: Employee) => {
        setQrBusy(true);
        router.delete(`/employees/${employee.id}/qr`, {
            preserveScroll: true,
            onFinish: () => {
                setQrBusy(false);
                setQrVersion((v) => v + 1);
            },
            onSuccess: () => setQrFor({ ...employee, has_qr: false }),
        });
    };

    const printQr = (employee: Employee) => {
        const win = window.open('', '_blank', 'width=420,height=620');
        if (!win) return;
        win.document.write(
            `<html><head><title>Coffee Allowance QR - ${employee.employee_code ?? ''}</title>` +
                `<style>body{font-family:system-ui,sans-serif;text-align:center;padding:32px}` +
                `img{width:260px;height:260px}.name{font-size:18px;font-weight:600;margin-top:12px}` +
                `.code{font-family:ui-monospace,monospace;font-size:15px;color:#444}` +
                `.position{font-size:13px;color:#666}</style></head><body>` +
                `<img src="/employees/${employee.id}/qr" alt="Coffee allowance QR" />` +
                `<div class="name">${employee.name}</div>` +
                `<div class="code">${employee.employee_code ?? ''}</div>` +
                `<div class="position">${employee.position ?? ''}</div>` +
                `</body></html>`,
        );
        win.document.close();
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

    const save = () => {
        if (!editing) return;
        setSaving(true);
        router.patch(
            `/employees/${editing.id}`,
            { position: position || null, employment_status: status, allowance_eligible: eligible },
            {
                preserveScroll: true,
                onFinish: () => setSaving(false),
                onSuccess: () => setEditing(null),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee Management" />
            <div className="flex h-full flex-1 flex-col gap-4 p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="flex items-center gap-2 text-2xl font-bold">
                        <UserCog className="h-6 w-6" />
                        Employee Management
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {employees.meta.total} {employees.meta.total === 1 ? 'employee' : 'employees'} &middot; allowance eligibility is
                        set here
                    </p>
                </div>

                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="text-base">Directory</CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="w-64 pl-8"
                                    placeholder="Search name, email or code"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                />
                            </div>
                            <Button variant="outline" onClick={() => applyFilters()}>
                                Search
                            </Button>
                            <Button
                                variant={filters.eligible_only ? 'default' : 'outline'}
                                onClick={() => applyFilters({ eligible_only: !filters.eligible_only || undefined })}
                            >
                                <Coffee className="mr-1 h-4 w-4" />
                                Allowance eligible
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Position</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Allowance Eligible</TableHead>
                                    <TableHead>QR</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                            No employees found.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {employees.data.map((employee) => (
                                    <TableRow key={employee.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                                                    {initials(employee.name)}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{employee.name}</div>
                                                    <div className="text-xs text-muted-foreground">{employee.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {employee.employee_code ? (
                                                <span className="font-mono text-sm">{employee.employee_code}</span>
                                            ) : (
                                                <span className="text-muted-foreground">&mdash;</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{employee.position ?? <span className="text-muted-foreground">&mdash;</span>}</TableCell>
                                        <TableCell>
                                            <Badge variant={employee.employment_status === 'active' ? 'default' : 'secondary'}>
                                                {employee.employment_status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {employee.can_redeem_allowance ? (
                                                <Badge className="bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-950/40">Yes</Badge>
                                            ) : (
                                                <span
                                                    className="text-sm text-muted-foreground"
                                                    title={employee.ineligibility_reason ?? undefined}
                                                >
                                                    No
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {employee.has_qr ? (
                                                <Badge className="bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/40">Issued</Badge>
                                            ) : (
                                                <span className="text-muted-foreground">&mdash;</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={!employee.can_redeem_allowance && !employee.has_qr}
                                                    title={
                                                        employee.can_redeem_allowance
                                                            ? 'Manage QR'
                                                            : (employee.ineligibility_reason ?? undefined)
                                                    }
                                                    onClick={() => setQrFor(employee)}
                                                >
                                                    <QrCode className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    title="Allowance ledger"
                                                    onClick={() => void openLedger(employee)}
                                                >
                                                    <Receipt className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => openEditor(employee)}>
                                                    Edit
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog
                open={ledger !== null || ledgerLoading}
                onOpenChange={(open) => {
                    if (!open) {
                        setLedger(null);
                        setLedgerLoading(false);
                    }
                }}
            >
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Allowance ledger</DialogTitle>
                    </DialogHeader>

                    {ledgerLoading && <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>}

                    {ledger && (
                        <div className="flex flex-col gap-4">
                            <div>
                                <div className="font-semibold">{ledger.employee.name}</div>
                                {ledger.employee.employee_code && (
                                    <div className="font-mono text-sm text-muted-foreground">{ledger.employee.employee_code}</div>
                                )}
                            </div>

                            {ledger.period === null ? (
                                <p className="rounded-md bg-amber-50 dark:bg-amber-950/40 p-3 text-sm text-amber-700 dark:text-amber-300">
                                    No active allowance period. The employee must be active and eligible.
                                </p>
                            ) : (
                                <>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="rounded-md border p-2">
                                            <div className="text-xs text-muted-foreground">Allowance</div>
                                            <div className="font-semibold">{peso(ledger.amount)}</div>
                                        </div>
                                        <div className="rounded-md border p-2">
                                            <div className="text-xs text-muted-foreground">Used</div>
                                            <div className="font-semibold">{peso(ledger.used)}</div>
                                        </div>
                                        <div className="rounded-md border p-2">
                                            <div className="text-xs text-muted-foreground">Remaining</div>
                                            <div className={ledger.remaining <= 0 ? 'font-semibold text-red-600 dark:text-red-400' : 'font-semibold text-green-700 dark:text-green-300'}>
                                                {peso(ledger.remaining)}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                                            {ledger.period}
                                        </div>
                                        {ledger.transactions.length === 0 ? (
                                            <p className="py-3 text-sm text-muted-foreground">No movement this period.</p>
                                        ) : (
                                            <ul className="divide-y text-sm">
                                                {ledger.transactions.map((entry) => (
                                                    <li key={entry.id} className="flex items-start justify-between gap-3 py-2">
                                                        <div>
                                                            <div className="font-medium">
                                                                {TYPE_LABELS[entry.type] ?? entry.type}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {entry.order_number ?? entry.description ?? '—'}
                                                            </div>
                                                            {entry.recorded_at && (
                                                                <div className="text-xs text-muted-foreground">{entry.recorded_at}</div>
                                                            )}
                                                        </div>
                                                        <div
                                                            className={
                                                                entry.signed_amount.startsWith('-')
                                                                    ? 'font-mono text-red-600 dark:text-red-400'
                                                                    : 'font-mono text-green-700 dark:text-green-300'
                                                            }
                                                        >
                                                            ₱{entry.signed_amount}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    {ledger.can_adjust && (
                                        <div className="rounded-md border p-3">
                                            <div className="mb-2 text-sm font-medium">Post an adjustment</div>
                                            <div className="flex flex-col gap-2">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Amount (negative to claw back)"
                                                    value={adjustAmount}
                                                    onChange={(e) => setAdjustAmount(e.target.value)}
                                                />
                                                <Input
                                                    placeholder="Reason (required)"
                                                    value={adjustReason}
                                                    onChange={(e) => setAdjustReason(e.target.value)}
                                                />
                                                <Button
                                                    onClick={submitAdjustment}
                                                    disabled={!adjustAmount || !adjustReason}
                                                >
                                                    Record adjustment
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {ledger.history.length > 1 && (
                                <div>
                                    <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">History</div>
                                    <ul className="divide-y text-sm">
                                        {ledger.history.map((period) => (
                                            <li key={period.label} className="flex justify-between py-1">
                                                <span>{period.label}</span>
                                                <span className="text-muted-foreground">
                                                    {peso(period.used)} used of {peso(period.amount)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={qrFor !== null} onOpenChange={(open) => !open && setQrFor(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Coffee allowance QR</DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col items-center gap-4">
                        <div className="text-center">
                            <div className="font-semibold">{qrFor?.name}</div>
                            {qrFor?.employee_code && (
                                <div className="font-mono text-sm text-muted-foreground">{qrFor.employee_code}</div>
                            )}
                        </div>

                        {qrFor?.has_qr ? (
                            <>
                                <div className="rounded-lg border bg-card p-4">
                                    <img
                                        key={qrVersion}
                                        src={`/employees/${qrFor.id}/qr?v=${qrVersion}`}
                                        alt={`QR code for ${qrFor.name}`}
                                        className="h-52 w-52"
                                    />
                                </div>
                                {qrFor.qr_issued_at && (
                                    <p className="text-xs text-muted-foreground">Issued {qrFor.qr_issued_at}</p>
                                )}
                            </>
                        ) : (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                No QR issued yet.
                            </p>
                        )}

                        <p className="text-center text-xs text-muted-foreground">
                            The QR holds an opaque token only &mdash; no name, balance or entitlement is encoded in it.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                        {qrFor?.has_qr && (
                            <Button variant="outline" onClick={() => qrFor && printQr(qrFor)}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                            </Button>
                        )}
                        {qrFor?.has_qr && (
                            <Button
                                variant="outline"
                                className="text-red-600 dark:text-red-400"
                                disabled={qrBusy}
                                onClick={() => qrFor && revokeQr(qrFor)}
                            >
                                <Ban className="mr-2 h-4 w-4" />
                                Revoke
                            </Button>
                        )}
                        <Button
                            disabled={qrBusy || !qrFor?.can_redeem_allowance}
                            title={qrFor?.can_redeem_allowance ? undefined : (qrFor?.ineligibility_reason ?? undefined)}
                            onClick={() => qrFor && issueQr(qrFor)}
                        >
                            <QrCode className="mr-2 h-4 w-4" />
                            {qrFor?.has_qr ? 'Generate new QR' : 'Generate QR'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="position">Position</Label>
                            <Input
                                id="position"
                                value={position}
                                placeholder="e.g. Barista"
                                onChange={(e) => setPosition(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="status">Employment status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((value) => (
                                        <SelectItem key={value} value={value}>
                                            {value}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-start gap-3 rounded-md border p-3">
                            <Checkbox
                                id="eligible"
                                checked={eligible}
                                onCheckedChange={(value) => setEligible(value === true)}
                            />
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="eligible">Eligible for coffee allowance</Label>
                                <p className="text-xs text-muted-foreground">
                                    {editing?.employee_code
                                        ? `Employee code ${editing.employee_code} is permanent and will not change.`
                                        : 'An employee code will be issued on save.'}
                                </p>
                                {editing && !editing.has_allowance_role && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400">
                                        Also needs the <strong>{allowance_role}</strong> role, assigned in User Roles.
                                        Ticking this alone will not grant the allowance.
                                    </p>
                                )}
                            </div>
                        </div>

                        {editing && !editing.can_redeem_allowance && editing.ineligibility_reason && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">Currently blocked: {editing.ineligibility_reason}</p>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditing(null)}>
                            Cancel
                        </Button>
                        <Button onClick={save} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

Index.layout = withAppShell;
