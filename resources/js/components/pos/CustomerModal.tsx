import React, { useState, useEffect } from 'react';
import { primaryColor, secondaryColor, accentColor } from './types';
import CustomerSelection from './CustomerSelection';

interface Customer {
    id: number;
    name: string;
}

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (orderType: string, beeperNumber: string) => void;
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
    // State for dine-in/takeout selection and beeper number
    const [orderType, setOrderType] = useState<string>('dine-in');
    const [beeperNumber, setBeeperNumber] = useState<string>('');
    
    // Reset beeper number field when modal opens
    useEffect(() => {
        if (isOpen) {
            setBeeperNumber(''); // Clear beeper number field when modal opens
        }
    }, [isOpen]);
    
    if (!isOpen) return null;

    // Handle completion with order type and beeper number
    const handleComplete = () => {
        onComplete(orderType, beeperNumber);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
                className="bg-white p-6 rounded shadow-lg w-96 max-h-[90vh] overflow-y-auto"
                style={{ backgroundColor: primaryColor, color: accentColor }}
            >
                <h2 className="text-xl font-semibold mb-4">Order Details</h2>
                
                {/* Customer Selection */}
                <div className="mb-5">
                    <h3 className="text-lg font-medium mb-2">Select Customer</h3>
                    <CustomerSelection
                        customers={customers}
                        selectedCustomer={selectedCustomer}
                        onCustomerSelect={setSelectedCustomer}
                    />
                </div>
                
                {/* Order Type Selection */}
                <div className="mb-5">
                    <h3 className="text-lg font-medium mb-2">Order Type</h3>
                    <div className="flex space-x-4">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name="orderType"
                                value="dine-in"
                                checked={orderType === 'dine-in'}
                                onChange={() => setOrderType('dine-in')}
                                className="mr-2"
                            />
                            <span>Dine In</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name="orderType"
                                value="takeout"
                                checked={orderType === 'takeout'}
                                onChange={() => setOrderType('takeout')}
                                className="mr-2"
                            />
                            <span>Takeout</span>
                        </label>
                    </div>
                </div>
                
                {/* Beeper Number Input */}
                <div className="mb-5">
                    <h3 className="text-lg font-medium mb-2">Beeper Number</h3>
                    <input
                        type="text"
                        value={beeperNumber}
                        onChange={(e) => setBeeperNumber(e.target.value)}
                        placeholder="Enter beeper number"
                        className="w-full px-3 py-2 border rounded focus:outline-none"
                        style={{
                            backgroundColor: secondaryColor,
                            color: accentColor,
                            border: `1px solid ${accentColor}`,
                        }}
                    />
                </div>

                {/* Buttons */}
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
                        onClick={handleComplete}
                    >
                        Process Order
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerModal; 