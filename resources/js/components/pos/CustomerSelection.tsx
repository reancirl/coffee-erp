import React, { useState } from 'react';
import { secondaryColor, accentColor } from './types';

interface Customer {
    id: number;
    name: string;
}

interface CustomerSelectionProps {
    customers: Customer[];
    selectedCustomer: Customer | null;
    onCustomerSelect: (customer: Customer | null) => void;
}

const CustomerSelection: React.FC<CustomerSelectionProps> = ({
    customers,
    selectedCustomer,
    onCustomerSelect,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [guestName, setGuestName] = useState('');
    const [isGuest, setIsGuest] = useState(true);

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            {/* Selection Section */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setIsGuest(true)}
                    className={`flex-1 p-2 rounded text-sm font-semibold ${
                        isGuest ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                >
                    Guest
                </button>
                <button
                    onClick={() => setIsGuest(false)}
                    className={`flex-1 p-2 rounded text-sm font-semibold ${
                        !isGuest ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                >
                    Existing Customer
                </button>
            </div>

            {/* Guest Section */}
            {isGuest && (
                <div className="mb-4">
                    <label className="block font-semibold mb-2">Guest Name (Optional)</label>
                    <input
                        type="text"
                        value={guestName}
                        onChange={(e) => {
                            setGuestName(e.target.value);
                            onCustomerSelect({ id: 0, name: e.target.value || 'Guest' });
                        }}
                        placeholder="Enter guest name"
                        className="w-full p-2 border rounded"
                        style={{
                            backgroundColor: secondaryColor,
                            color: accentColor,
                            borderColor: accentColor,
                        }}
                    />
                </div>
            )}
            
            {/* Customer Search Section */}
            {!isGuest && (
                <>
                 {/* QR Code Section */}
                    <div className="mb-4">
                        <button
                            onClick={() => alert('QR code scanning functionality will be implemented here')}
                            className="w-full p-2 rounded text-sm font-semibold"
                            style={{
                                backgroundColor: secondaryColor,
                                color: accentColor,
                                border: `1px solid ${accentColor}`,
                            }}
                        >
                            Scan QR Code
                        </button>
                    </div>
                    <div className="mb-4">
                        <label className="block font-semibold mb-2">Search Customer</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search customers..."
                            className="w-full p-2 border rounded mb-2"
                            style={{
                                backgroundColor: secondaryColor,
                                color: accentColor,
                                borderColor: accentColor,
                            }}
                        />
                        {searchTerm && (
                            <div className="max-h-40 overflow-y-auto">
                                {filteredCustomers.map((customer) => (
                                    <div
                                        key={customer.id}
                                        onClick={() => onCustomerSelect(customer)}
                                        className={`p-2 cursor-pointer hover:bg-gray-700 ${
                                            selectedCustomer?.id === customer.id ? 'bg-gray-700' : ''
                                        }`}
                                    >
                                        {customer.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default CustomerSelection; 