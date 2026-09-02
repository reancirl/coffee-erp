import React, { useMemo, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from '@/components/ui/dialog';
import { 
    Wallet, 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    Calculator,
    Calendar,
    Banknote,
    ShieldCheck
} from 'lucide-react';

interface Remittance {
    id: number;
    destination: string;
    method: string;
    amount: number;
    reference?: string | null;
    notes?: string | null;
    status: 'pending' | 'confirmed';
    attachment_url?: string | null;
    confirmed_at?: string | null;
    confirmed_by?: { name: string } | null;
    created_at: string;
}

interface SalesMonitoring {
    id: number;
    monitoring_date: string;
    opening_balance: number;
    cash_sales: number;
    gcash_sales: number;
    split_cash_sales: number;
    split_gcash_sales: number;
    allowance_sales: number;
    other_sales: number;
    cash_in: number;
    cash_out: number;
    expected_balance: number;
    actual_balance: number | null;
    variance: number;
    cash_in_notes: string | null;
    cash_out_notes: string | null;
    variance_notes: string | null;
    status: 'open' | 'closed';
    opened_by: { name: string } | null;
    closed_by: { name: string } | null;
    opened_at: string | null;
    closed_at: string | null;
    total_sales: number;
    total_cash: number;
    total_gcash: number;
    remittances?: Remittance[];
}

interface Props {
    currentMonitoring: SalesMonitoring;
    recentMonitoring: SalesMonitoring[];
}

export default function SalesMonitoringSimple({ currentMonitoring, recentMonitoring }: Props) {
    const [cashInAmount, setCashInAmount] = useState('');
    const [cashInNotes, setCashInNotes] = useState('');
    const [cashOutAmount, setCashOutAmount] = useState('');
    const [cashOutNotes, setCashOutNotes] = useState('');
    const [actualBalance, setActualBalance] = useState('');
    const [varianceNotes, setVarianceNotes] = useState('');
    const [showCashInModal, setShowCashInModal] = useState(false);
    const [showCashOutModal, setShowCashOutModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showRemitModal, setShowRemitModal] = useState(false);
    const remittanceForm = useForm({
        destination: '',
        method: '',
        amount: '',
        reference: '',
        notes: '',
        attachment: null as File | null,
    });

    const handleCashFlow = (type: 'cash_in' | 'cash_out') => {
        const amount = type === 'cash_in' ? cashInAmount : cashOutAmount;
        const notes = type === 'cash_in' ? cashInNotes : cashOutNotes;

        if (!amount || !notes) {
            alert('Please fill in all fields');
            return;
        }

        router.patch(`/sales-monitoring/${currentMonitoring.id}/cash-flow`, {
            type,
            amount: parseFloat(amount),
            notes,
        }, {
            onSuccess: () => {
                if (type === 'cash_in') {
                    setCashInAmount('');
                    setCashInNotes('');
                    setShowCashInModal(false);
                } else {
                    setCashOutAmount('');
                    setCashOutNotes('');
                    setShowCashOutModal(false);
                }
            }
        });
    };

    const handleClose = () => {
        if (!actualBalance) {
            alert('Please enter the actual cash balance');
            return;
        }

        router.patch(`/sales-monitoring/${currentMonitoring.id}/close`, {
            actual_balance: parseFloat(actualBalance),
            variance_notes: varianceNotes,
        }, {
            onSuccess: () => {
                setActualBalance('');
                setVarianceNotes('');
                setShowCloseModal(false);
            }
        });
    };

    const formatCurrency = (amount: number | undefined | null) => {
        const safeAmount = amount || 0;
        return `₱${safeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };
    const availableCash = useMemo(
        () => Number(currentMonitoring.expected_balance ?? 0),
        [currentMonitoring.expected_balance],
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const submitRemittance = () => {
        if (!remittanceForm.data.destination || !remittanceForm.data.method || !remittanceForm.data.amount) {
            alert('Please fill destination, method, and amount.');
            return;
        }

        remittanceForm.post(`/sales-monitoring/${currentMonitoring.id}/remittances`, {
            forceFormData: true,
            onSuccess: () => {
                remittanceForm.reset();
                remittanceForm.setData('attachment', null);
                setShowRemitModal(false);
            },
        });
    };

    const confirmRemittance = (id: number) => {
        router.patch(`/cash-remittances/${id}/confirm`);
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AppLayout>
            <Head title="Sales Monitoring" />
            
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Sales Monitoring</h1>
                        <p className="text-muted-foreground">
                            Daily cash flow tracking and end-of-day reconciliation
                        </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        currentMonitoring.status === 'open' 
                            ? 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300' 
                            : 'bg-muted text-foreground'
                    }`}>
                        {currentMonitoring.status === 'open' ? 'Active' : 'Closed'}
                    </span>
                </div>

                {/* Current Day Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            {formatDate(currentMonitoring.monitoring_date)}
                        </CardTitle>
                        <CardDescription>
                            Opened by {currentMonitoring.opened_by?.name} at {currentMonitoring.opened_at ? formatTime(currentMonitoring.opened_at) : 'N/A'}
                            {currentMonitoring.status === 'closed' && currentMonitoring.closed_at && (
                                <> • Closed at {formatTime(currentMonitoring.closed_at)}</>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Opening Balance */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm font-medium">Opening Balance</span>
                                </div>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {formatCurrency(currentMonitoring.opening_balance)}
                                </p>
                            </div>

                            {/* Total Sales */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-green-500" />
                                    <span className="text-sm font-medium">Total Sales</span>
                                </div>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(currentMonitoring.total_sales)}
                                </p>
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <div>Cash: {formatCurrency(currentMonitoring.total_cash)}</div>
                                    <div>GCash: {formatCurrency(currentMonitoring.total_gcash)}</div>
                                    {Number(currentMonitoring.allowance_sales) > 0 && (
                                        <div>Employee Allowance: {formatCurrency(currentMonitoring.allowance_sales)}</div>
                                    )}
                                    {Number(currentMonitoring.other_sales) > 0 && (
                                        <div className="text-amber-600 dark:text-amber-400">
                                            Unrecognised: {formatCurrency(currentMonitoring.other_sales)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Remittances */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Banknote className="h-4 w-4 text-indigo-500" />
                                    <span className="text-sm font-medium">Remittances</span>
                                </div>
                                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                    {formatCurrency(
                                        (currentMonitoring.remittances || []).reduce((sum, r) => sum + (r.amount || 0), 0),
                                    )}
                                </p>
                                <Button size="sm" variant="outline" onClick={() => setShowRemitModal(true)}>
                                    Log remittance
                                </Button>
                            </div>

                            {/* Cash Flow */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-orange-500" />
                                    <span className="text-sm font-medium">Cash Flow</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-600 dark:text-green-400">Cash In:</span>
                                        <span>{formatCurrency(currentMonitoring.cash_in)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-red-600 dark:text-red-400">Cash Out:</span>
                                        <span>{formatCurrency(currentMonitoring.cash_out)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Expected vs Actual */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Calculator className="h-4 w-4 text-purple-500" />
                                    <span className="text-sm font-medium">Balance</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span>Expected:</span>
                                        <span>{formatCurrency(currentMonitoring.expected_balance)}</span>
                                    </div>
                                    {currentMonitoring.actual_balance !== null && (
                                        <>
                                            <div className="flex justify-between text-sm">
                                                <span>Actual:</span>
                                                <span>{formatCurrency(currentMonitoring.actual_balance)}</span>
                                            </div>
                                            <div className={`flex justify-between text-sm font-medium ${
                                                currentMonitoring.variance === 0 ? 'text-green-600 dark:text-green-400' : 
                                                currentMonitoring.variance > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                                            }`}>
                                                <span>Variance:</span>
                                                <span>{formatCurrency(currentMonitoring.variance)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                {currentMonitoring.status === 'open' && (
                    <div className="flex gap-4">
                        <Dialog open={showCashInModal} onOpenChange={setShowCashInModal}>
                            <DialogTrigger asChild>
                                <Button className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Cash In
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Record Cash In</DialogTitle>
                                    <DialogDescription>
                                        Add cash to the register (change fund, deposits, etc.)
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="cashInAmount">Amount</Label>
                                        <Input
                                            id="cashInAmount"
                                            type="number"
                                            step="0.01"
                                            value={cashInAmount}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCashInAmount(e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="cashInNotes">Notes</Label>
                                        <textarea
                                            id="cashInNotes"
                                            value={cashInNotes}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCashInNotes(e.target.value)}
                                            placeholder="Reason for cash in..."
                                            className="w-full p-2 border rounded-md"
                                            rows={3}
                                        />
                                    </div>
                                    <Button onClick={() => handleCashFlow('cash_in')} className="w-full">
                                        Record Cash In
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={showCashOutModal} onOpenChange={setShowCashOutModal}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="flex items-center gap-2">
                                    <TrendingDown className="h-4 w-4" />
                                    Cash Out
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Record Cash Out</DialogTitle>
                                    <DialogDescription>
                                        Remove cash from the register (expenses, withdrawals, etc.)
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="cashOutAmount">Amount</Label>
                                        <Input
                                            id="cashOutAmount"
                                            type="number"
                                            step="0.01"
                                            value={cashOutAmount}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCashOutAmount(e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="cashOutNotes">Notes</Label>
                                        <textarea
                                            id="cashOutNotes"
                                            value={cashOutNotes}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCashOutNotes(e.target.value)}
                                            placeholder="Reason for cash out..."
                                            className="w-full p-2 border rounded-md"
                                            rows={3}
                                        />
                                    </div>
                                    <Button onClick={() => handleCashFlow('cash_out')} className="w-full">
                                        Record Cash Out
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={showCloseModal} onOpenChange={setShowCloseModal}>
                            <DialogTrigger asChild>
                                <Button variant="destructive" className="flex items-center gap-2">
                                    Close Day
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Close Sales Monitoring</DialogTitle>
                                    <DialogDescription>
                                        Count the actual cash in the register and close the day
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="p-4 bg-muted rounded-lg">
                                        <div className="text-sm text-muted-foreground mb-2">Expected Balance:</div>
                                        <div className="text-2xl font-bold">
                                            {formatCurrency(currentMonitoring.expected_balance)}
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="actualBalance">Actual Cash Count</Label>
                                        <Input
                                            id="actualBalance"
                                            type="number"
                                            step="0.01"
                                            value={actualBalance}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActualBalance(e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {actualBalance && (
                                        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg">
                                            <div className="text-sm text-muted-foreground">Variance:</div>
                                            <div className={`text-lg font-semibold ${
                                                (parseFloat(actualBalance) - currentMonitoring.expected_balance) === 0 ? 'text-green-600 dark:text-green-400' :
                                                (parseFloat(actualBalance) - currentMonitoring.expected_balance) > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                                            }`}>
                                                {formatCurrency(parseFloat(actualBalance) - currentMonitoring.expected_balance)}
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <Label htmlFor="varianceNotes">Variance Notes (Optional)</Label>
                                        <textarea
                                            id="varianceNotes"
                                            value={varianceNotes}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setVarianceNotes(e.target.value)}
                                            placeholder="Explain any variance..."
                                            className="w-full p-2 border rounded-md"
                                            rows={3}
                                        />
                                    </div>
                                    <Button onClick={handleClose} className="w-full">
                                        Close Sales Monitoring
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}

                <Dialog open={showRemitModal} onOpenChange={setShowRemitModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Log remittance</DialogTitle>
                            <DialogDescription>Record funds sent to bank or vault for this shift/day.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <Label>Destination</Label>
                                    <Input
                                        value={remittanceForm.data.destination}
                                        onChange={(e) => remittanceForm.setData('destination', e.target.value)}
                                        placeholder="BPI - Main, Vault"
                                    />
                                </div>
                                <div>
                                    <Label>Method</Label>
                                    <Input
                                        value={remittanceForm.data.method}
                                        onChange={(e) => remittanceForm.setData('method', e.target.value)}
                                        placeholder="Cash deposit, GCash"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <Label>Amount</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={remittanceForm.data.amount}
                                        onChange={(e) => remittanceForm.setData('amount', e.target.value)}
                                        placeholder="0.00"
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">Available: {formatCurrency(availableCash)}</p>
                                </div>
                                <div>
                                    <Label>Reference (optional)</Label>
                                    <Input
                                        value={remittanceForm.data.reference}
                                        onChange={(e) => remittanceForm.setData('reference', e.target.value)}
                                        placeholder="GCash ref, deposit slip"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Notes (optional)</Label>
                                <textarea
                                    value={remittanceForm.data.notes}
                                    onChange={(e) => remittanceForm.setData('notes', e.target.value)}
                                    className="w-full rounded-md border p-2"
                                    rows={3}
                                    placeholder="Any details"
                                />
                            </div>
                            <div>
                                <Label>Proof (optional)</Label>
                                <Input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => remittanceForm.setData('attachment', e.target.files?.[0] ?? null)}
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowRemitModal(false)}>
                                Cancel
                            </Button>
                            <Button onClick={submitRemittance} disabled={remittanceForm.processing}>
                                {remittanceForm.processing ? 'Saving…' : 'Save remittance'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Remittances */}
                <Card>
                    <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Remittances</CardTitle>
                            <CardDescription>Cash moved to bank/vault for this day</CardDescription>
                        </div>
                        <Button variant="outline" onClick={() => setShowRemitModal(true)}>
                            Log remittance
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {(currentMonitoring.remittances?.length || 0) === 0 ? (
                            <p className="text-sm text-muted-foreground">No remittances recorded yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="px-3 py-2">Destination</th>
                                            <th className="px-3 py-2">Method</th>
                                            <th className="px-3 py-2">Reference</th>
                                            <th className="px-3 py-2">Amount</th>
                                            <th className="px-3 py-2">Status</th>
                                            <th className="px-3 py-2">Proof</th>
                                            <th className="px-3 py-2 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentMonitoring.remittances?.map((remit) => (
                                            <tr key={remit.id} className="border-b hover:bg-muted">
                                                <td className="px-3 py-2">
                                                    <div className="font-medium text-foreground">{remit.destination}</div>
                                                    {remit.notes && <div className="text-xs text-muted-foreground">{remit.notes}</div>}
                                                </td>
                                                <td className="px-3 py-2">{remit.method}</td>
                                                <td className="px-3 py-2 text-foreground">{remit.reference || '—'}</td>
                                                <td className="px-3 py-2 font-semibold text-foreground">{formatCurrency(remit.amount)}</td>
                                                <td className="px-3 py-2">
                                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                                                        remit.status === 'confirmed'
                                                            ? 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300'
                                                            : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                                                    }`}>
                                                        {remit.status === 'confirmed' ? (
                                                            <>
                                                                <ShieldCheck className="h-3.5 w-3.5" /> Confirmed
                                                            </>
                                                        ) : (
                                                            'Pending'
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2">
                                                    {remit.attachment_url ? (
                                                        <a
                                                            href={remit.attachment_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-primary hover:underline"
                                                        >
                                                            View
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    {remit.status === 'pending' && (
                                                        <Button size="sm" onClick={() => confirmRemittance(remit.id)}>
                                                            Confirm
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Sales Monitoring History</CardTitle>
                        <CardDescription>Last 10 cash monitoring sessions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">Date</th>
                                        <th className="text-left p-2">Opening</th>
                                        <th className="text-left p-2">Sales</th>
                                        <th className="text-left p-2">Cash In/Out</th>
                                        <th className="text-left p-2">Expected</th>
                                        <th className="text-left p-2">Actual</th>
                                        <th className="text-left p-2">Variance</th>
                                        <th className="text-left p-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentMonitoring.map((monitoring) => (
                                        <tr key={monitoring.id} className="border-b hover:bg-muted">
                                            <td className="p-2 font-medium">
                                                {formatDate(monitoring.monitoring_date)}
                                            </td>
                                            <td className="p-2">{formatCurrency(monitoring.opening_balance)}</td>
                                            <td className="p-2">{formatCurrency(monitoring.total_sales)}</td>
                                            <td className="p-2">
                                                <div className="text-xs">
                                                    <div className="text-green-600 dark:text-green-400">+{formatCurrency(monitoring.cash_in)}</div>
                                                    <div className="text-red-600 dark:text-red-400">-{formatCurrency(monitoring.cash_out)}</div>
                                                </div>
                                            </td>
                                            <td className="p-2">{formatCurrency(monitoring.expected_balance)}</td>
                                            <td className="p-2">
                                                {monitoring.actual_balance !== null 
                                                    ? formatCurrency(monitoring.actual_balance) 
                                                    : '-'
                                                }
                                            </td>
                                            <td className="p-2">
                                                {monitoring.actual_balance !== null ? (
                                                    <span className={
                                                        monitoring.variance === 0 ? 'text-green-600 dark:text-green-400' :
                                                        monitoring.variance > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                                                    }>
                                                        {formatCurrency(monitoring.variance)}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="p-2">
                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                    monitoring.status === 'open' 
                                                        ? 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300' 
                                                        : 'bg-muted text-foreground'
                                                }`}>
                                                    {monitoring.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
