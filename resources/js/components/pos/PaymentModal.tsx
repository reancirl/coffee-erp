import React, { useRef, useEffect } from 'react';
import { primaryColor, accentColor } from './types';

interface PaymentMethod {
    id: string;
    name: string;
}

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPaymentMethodSelect: (method: PaymentMethod) => void;
    onConfirmPayment: (method: PaymentMethod) => void;
    paymentMethods: PaymentMethod[];
    selectedPaymentMethod: PaymentMethod | null;
    amount: number;
    cashAmountGiven: string;
    setCashAmountGiven: (amount: string) => void;
    receiptImage: File | null;
    setReceiptImage: (file: File | null) => void;
    // Employee allowance
    onScanEmployee: () => void;
    scannedEmployee: {
        name: string;
        employee_code: string | null;
        allowance: { remaining: number } | null;
    } | null;
    clearScannedEmployee: () => void;
    // Split payment props
    splitCashAmount: string;
    setSplitCashAmount: (amount: string) => void;
    splitGcashAmount: string;
    setSplitGcashAmount: (amount: string) => void;
    splitAllowanceAmount: string;
    setSplitAllowanceAmount: (amount: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    onPaymentMethodSelect,
    onConfirmPayment,
    paymentMethods,
    selectedPaymentMethod,
    amount,
    cashAmountGiven,
    setCashAmountGiven,
    setReceiptImage,
    onScanEmployee,
    scannedEmployee,
    clearScannedEmployee,
    splitCashAmount,
    setSplitCashAmount,
    splitGcashAmount,
    setSplitGcashAmount,
    splitAllowanceAmount,
    setSplitAllowanceAmount,
}) => {
    // Create a ref for the cash input field
    const cashInputRef = useRef<HTMLInputElement>(null);
    
    // Focus on the cash input when cash is selected
    useEffect(() => {
        if (selectedPaymentMethod?.id === 'cash' && cashInputRef.current) {
            // Short timeout to ensure the DOM is ready
            setTimeout(() => {
                cashInputRef.current?.focus();
            }, 50);
        }
    }, [selectedPaymentMethod]);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div
                className="bg-card p-6 rounded shadow-lg w-96"
                style={{ backgroundColor: primaryColor, color: accentColor }}
            >
                <h2 className="text-xl font-semibold mb-4">Select Payment Method</h2>
                <div className="grid grid-cols-1 gap-4">
                    {paymentMethods.map((method) => (
                        <div
                            key={method.id}
                            onClick={() => onPaymentMethodSelect(method)}
                            className={`p-4 border rounded cursor-pointer text-center ${
                                selectedPaymentMethod?.id === method.id
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'bg-muted text-foreground'
                            }`}
                        >
                            {method.name}
                        </div>
                    ))}
                </div>

                <div className="mt-4">
                    <p className="text-4xl font-bold">Total: ₱{amount}</p>
                </div>

                {selectedPaymentMethod?.id === 'cash' && (
                    <div className="mt-4">
                        <label className="block mb-2">Amount Given</label>
                        <input
                            ref={cashInputRef}
                            type="number"
                            value={cashAmountGiven}
                            onChange={(e) => setCashAmountGiven(e.target.value)}
                            className="w-full p-2 border rounded"
                            placeholder="Enter amount"
                            min={amount}
                            step="0.01"
                        />
                        {cashAmountGiven && (
                            <div className="mt-2">
                                <p className="text-lg font-semibold">
                                    Change: ₱{(parseFloat(cashAmountGiven) - amount).toFixed(2)}
                                </p>
                                {parseFloat(cashAmountGiven) < amount && (
                                    <p className="text-red-500 text-sm mt-1">
                                        Amount given is less than the total amount
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {(selectedPaymentMethod?.id === 'debit') && (
                    <div className="mt-4">
                        <label className="block mb-2">Upload Receipt</label>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => setReceiptImage(e.target.files?.[0] || null)}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                )}

                {(selectedPaymentMethod?.id === 'employee-allowance' ||
                    selectedPaymentMethod?.id === 'allowance-cash') && (
                    <div className="mt-4">
                        <label className="block mb-2">Employee</label>
                        {scannedEmployee ? (
                            <div className="flex items-center justify-between rounded border p-3">
                                <div>
                                    <div className="font-semibold">{scannedEmployee.name}</div>
                                    {scannedEmployee.employee_code && (
                                        <div className="font-mono text-sm text-muted-foreground">
                                            {scannedEmployee.employee_code}
                                        </div>
                                    )}
                                    {scannedEmployee.allowance && (
                                        <div className="text-sm text-muted-foreground">
                                            ₱{scannedEmployee.allowance.remaining.toFixed(2)} left
                                            this month
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={clearScannedEmployee}
                                    className="rounded border px-3 py-1 text-sm"
                                >
                                    Rescan
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={onScanEmployee}
                                className="w-full rounded border-2 border-dashed p-4 text-sm text-muted-foreground hover:bg-muted"
                            >
                                Scan Employee QR
                            </button>
                        )}
                    </div>
                )}

                {selectedPaymentMethod?.id === 'allowance-cash' && scannedEmployee && (
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-3">Allowance + Cash</h3>

                        {(() => {
                            const remaining = scannedEmployee.allowance?.remaining ?? 0;
                            const fromAllowance = parseFloat(splitAllowanceAmount || '0');
                            const fromCash = parseFloat(splitCashAmount || '0');
                            const covers = Math.min(remaining, amount);

                            return (
                                <>
                                    {/* The usual case is "spend what is left, pay the
                                        rest in cash", so offer exactly that. */}
                                    {!splitAllowanceAmount && covers > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSplitAllowanceAmount(covers.toFixed(2));
                                                setSplitCashAmount((amount - covers).toFixed(2));
                                            }}
                                            className="mb-3 w-full rounded border-2 border-dashed p-3 text-sm hover:bg-muted"
                                        >
                                            Use ₱{covers.toFixed(2)} of allowance and take ₱
                                            {(amount - covers).toFixed(2)} in cash
                                        </button>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block mb-2">From Allowance</label>
                                            <input
                                                type="number"
                                                value={splitAllowanceAmount}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setSplitAllowanceAmount(value);
                                                    const rest = amount - parseFloat(value || '0');
                                                    setSplitCashAmount(rest > 0 ? rest.toFixed(2) : '0');
                                                }}
                                                className="w-full p-2 border rounded"
                                                placeholder="Enter allowance amount"
                                                min="0"
                                                max={Math.min(remaining, amount)}
                                                step="0.01"
                                            />
                                        </div>

                                        <div>
                                            <label className="block mb-2">Cash Amount</label>
                                            <input
                                                type="number"
                                                value={splitCashAmount}
                                                onChange={(e) => setSplitCashAmount(e.target.value)}
                                                className="w-full p-2 border rounded bg-muted text-foreground"
                                                placeholder="Auto-calculated"
                                                readOnly
                                            />
                                        </div>
                                    </div>

                                    {splitAllowanceAmount && (
                                        <div className="mt-3 p-3 bg-muted rounded text-foreground">
                                            <p className="text-sm">
                                                <strong>Allowance:</strong> ₱{fromAllowance.toFixed(2)} +
                                                <strong> Cash:</strong> ₱{fromCash.toFixed(2)} =
                                                <strong> Total:</strong> ₱
                                                {(fromAllowance + fromCash).toFixed(2)}
                                            </p>
                                            {fromAllowance > remaining + 0.01 && (
                                                <p className="text-red-500 text-sm mt-1">
                                                    Only ₱{remaining.toFixed(2)} is left on this
                                                    allowance.
                                                </p>
                                            )}
                                            {Math.abs(fromAllowance + fromCash - amount) > 0.01 && (
                                                <p className="text-red-500 text-sm mt-1">
                                                    The two amounts must add up to ₱
                                                    {amount.toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}

                {selectedPaymentMethod?.id === 'split' && (
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-3">Split Payment (Cash + GCash)</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-2">Cash Amount</label>
                                <input
                                    type="number"
                                    value={splitCashAmount}
                                    onChange={(e) => {
                                        const cashValue = e.target.value;
                                        setSplitCashAmount(cashValue);
                                        // Auto-calculate GCash amount
                                        const remaining = amount - parseFloat(cashValue || '0');
                                        setSplitGcashAmount(remaining > 0 ? remaining.toFixed(2) : '0');
                                    }}
                                    className="w-full p-2 border rounded"
                                    placeholder="Enter cash amount"
                                    min="0"
                                    max={amount}
                                    step="0.01"
                                />
                            </div>
                            
                            <div>
                                <label className="block mb-2">GCash Amount</label>
                                <input
                                    type="number"
                                    value={splitGcashAmount}
                                    onChange={(e) => setSplitGcashAmount(e.target.value)}
                                    className="w-full p-2 border rounded bg-muted text-foreground"
                                    placeholder="Auto-calculated"
                                    readOnly
                                />
                            </div>
                        </div>
                        
                        {splitCashAmount && splitGcashAmount && (
                            <div className="mt-3 p-3 bg-muted rounded text-foreground">
                                <p className="text-sm">
                                    <strong>Cash:</strong> ₱{parseFloat(splitCashAmount || '0').toFixed(2)} + 
                                    <strong> GCash:</strong> ₱{parseFloat(splitGcashAmount || '0').toFixed(2)} = 
                                    <strong> Total:</strong> ₱{(parseFloat(splitCashAmount || '0') + parseFloat(splitGcashAmount || '0')).toFixed(2)}
                                </p>
                                {(parseFloat(splitCashAmount || '0') + parseFloat(splitGcashAmount || '0')) !== amount && (
                                    <p className="text-red-500 text-sm mt-1">
                                        Split amounts must equal the total amount of ₱{amount.toFixed(2)}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-6 flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/80"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => selectedPaymentMethod && onConfirmPayment(selectedPaymentMethod)}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        disabled={!selectedPaymentMethod || 
                            (selectedPaymentMethod?.id === 'cash' && 
                                (!cashAmountGiven || parseFloat(cashAmountGiven) < amount)) ||
                            (selectedPaymentMethod?.id === 'split' && 
                                (!splitCashAmount || !splitGcashAmount || 
                                 (parseFloat(splitCashAmount || '0') + parseFloat(splitGcashAmount || '0')) !== amount)) ||
                            (selectedPaymentMethod?.id === 'allowance-cash' &&
                                (!scannedEmployee ||
                                 !splitAllowanceAmount ||
                                 parseFloat(splitAllowanceAmount || '0') <= 0 ||
                                 parseFloat(splitCashAmount || '0') <= 0 ||
                                 parseFloat(splitAllowanceAmount || '0') >
                                     (scannedEmployee.allowance?.remaining ?? 0) + 0.01 ||
                                 Math.abs(
                                     parseFloat(splitAllowanceAmount || '0') +
                                         parseFloat(splitCashAmount || '0') -
                                         amount
                                 ) > 0.01))}
                    >
                        Complete Payment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal; 