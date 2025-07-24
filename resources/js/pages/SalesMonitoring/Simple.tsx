import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
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
    Calendar
} from 'lucide-react';

interface SalesMonitoring {
    id: number;
    monitoring_date: string;
    opening_balance: number;
    cash_sales: number;
    gcash_sales: number;
    split_cash_sales: number;
    split_gcash_sales: number;
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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
                        <p className="text-gray-600">
                            Daily cash flow tracking and end-of-day reconciliation
                        </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        currentMonitoring.status === 'open' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
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
                                <p className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(currentMonitoring.opening_balance)}
                                </p>
                            </div>

                            {/* Total Sales */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-green-500" />
                                    <span className="text-sm font-medium">Total Sales</span>
                                </div>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatCurrency(currentMonitoring.total_sales)}
                                </p>
                                <div className="text-xs text-gray-500 space-y-1">
                                    <div>Cash: {formatCurrency(currentMonitoring.total_cash)}</div>
                                    <div>GCash: {formatCurrency(currentMonitoring.total_gcash)}</div>
                                </div>
                            </div>

                            {/* Cash Flow */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-orange-500" />
                                    <span className="text-sm font-medium">Cash Flow</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-600">Cash In:</span>
                                        <span>{formatCurrency(currentMonitoring.cash_in)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-red-600">Cash Out:</span>
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
                                                currentMonitoring.variance === 0 ? 'text-green-600' : 
                                                currentMonitoring.variance > 0 ? 'text-blue-600' : 'text-red-600'
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
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="text-sm text-gray-600 mb-2">Expected Balance:</div>
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
                                        <div className="p-3 bg-blue-50 rounded-lg">
                                            <div className="text-sm text-gray-600">Variance:</div>
                                            <div className={`text-lg font-semibold ${
                                                (parseFloat(actualBalance) - currentMonitoring.expected_balance) === 0 ? 'text-green-600' :
                                                (parseFloat(actualBalance) - currentMonitoring.expected_balance) > 0 ? 'text-blue-600' : 'text-red-600'
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
                                        <tr key={monitoring.id} className="border-b hover:bg-gray-50">
                                            <td className="p-2 font-medium">
                                                {formatDate(monitoring.monitoring_date)}
                                            </td>
                                            <td className="p-2">{formatCurrency(monitoring.opening_balance)}</td>
                                            <td className="p-2">{formatCurrency(monitoring.total_sales)}</td>
                                            <td className="p-2">
                                                <div className="text-xs">
                                                    <div className="text-green-600">+{formatCurrency(monitoring.cash_in)}</div>
                                                    <div className="text-red-600">-{formatCurrency(monitoring.cash_out)}</div>
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
                                                        monitoring.variance === 0 ? 'text-green-600' :
                                                        monitoring.variance > 0 ? 'text-blue-600' : 'text-red-600'
                                                    }>
                                                        {formatCurrency(monitoring.variance)}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="p-2">
                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                    monitoring.status === 'open' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-gray-100 text-gray-800'
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
