import React, { useRef, useEffect } from 'react';
import { primaryColor, secondaryColor, accentColor } from './types';

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
    qrCodeImage: File | null;
    setQrCodeImage: (file: File | null) => void;
    // Split payment props
    splitCashAmount: string;
    setSplitCashAmount: (amount: string) => void;
    splitGcashAmount: string;
    setSplitGcashAmount: (amount: string) => void;
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
    receiptImage,
    setReceiptImage,
    qrCodeImage,
    setQrCodeImage,
    splitCashAmount,
    setSplitCashAmount,
    splitGcashAmount,
    setSplitGcashAmount,
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div
                className="bg-white p-6 rounded shadow-lg w-96"
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
                                    : 'bg-gray-200 text-black'
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

                {selectedPaymentMethod?.id === 'pmna' && (
                    <div className="mt-4">
                        <label className="block mb-2">Scan QR Code</label>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => setQrCodeImage(e.target.files?.[0] || null)}
                            className="w-full p-2 border rounded"
                        />
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
                                    className="w-full p-2 border rounded bg-gray-100 text-black"
                                    placeholder="Auto-calculated"
                                    readOnly
                                />
                            </div>
                        </div>
                        
                        {splitCashAmount && splitGcashAmount && (
                            <div className="mt-3 p-3 bg-gray-100 rounded text-black">
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
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
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
                                 (parseFloat(splitCashAmount || '0') + parseFloat(splitGcashAmount || '0')) !== amount))}
                    >
                        Complete Payment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal; 