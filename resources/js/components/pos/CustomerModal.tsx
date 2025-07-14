import React from 'react';
import { primaryColor, secondaryColor, accentColor } from './types';
import CustomerSelection from './CustomerSelection';

interface Customer {
    id: number;
    name: string;
}

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    customers: Customer[];
    selectedCustomer: Customer | null;
    setSelectedCustomer: (customer: Customer | null) => void;
}

const CustomerModal: React.FC<CustomerModalProps> = ({
    isOpen,
    onClose,
    onComplete,
    customers,
    selectedCustomer,
    setSelectedCustomer,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div
                className="bg-white p-6 rounded shadow-lg w-96"
                style={{ backgroundColor: primaryColor, color: accentColor }}
            >
                <h2 className="text-xl font-semibold mb-4">Select Customer</h2>
                
                <CustomerSelection
                    customers={customers}
                    selectedCustomer={selectedCustomer}
                    onCustomerSelect={setSelectedCustomer}
                />

                <div className="flex justify-end mt-4">
                    <button
                        className="mr-2 px-4 py-2 rounded text-sm font-semibold"
                        style={{
                            backgroundColor: secondaryColor,
                            color: accentColor,
                            border: `1px solid ${accentColor}`,
                        }}
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 rounded text-sm font-semibold"
                        style={{
                            backgroundColor: secondaryColor,
                            color: accentColor,
                            border: `1px solid ${accentColor}`,
                        }}
                        onClick={onComplete}
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerModal; 