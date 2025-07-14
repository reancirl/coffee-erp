import React from 'react';
import { Product, primaryColor, secondaryColor, accentColor } from './types';

interface DiscountModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Product[];
    discountType: string;
    setDiscountType: (type: string) => void;
    discountSelections: { [key: number]: boolean };
    setDiscountSelections: (selections: { [key: number]: boolean } | ((prev: { [key: number]: boolean }) => { [key: number]: boolean })) => void;
}

const DiscountModal: React.FC<DiscountModalProps> = ({
    isOpen,
    onClose,
    order,
    discountType,
    setDiscountType,
    discountSelections,
    setDiscountSelections,
}) => {
    if (!isOpen) return null;

    const calculateDiscountTotal = () => {
        return order
            .reduce((acc, item) => (discountSelections[item.id] ? acc + item.price * 0.2 : acc), 0)
            .toFixed(2);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div
                className="bg-white p-6 rounded shadow-lg w-96"
                style={{ backgroundColor: primaryColor, color: accentColor }}
            >
                <h2 className="text-xl font-semibold mb-4">Apply Discount</h2>
                <div className="mb-4">
                    <label className="mr-2">Discount Type:</label>
                    <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                        className="p-2 border rounded"
                        style={{
                            color: accentColor,
                            backgroundColor: secondaryColor,
                            borderColor: accentColor,
                        }}
                    >
                        <option value="Senior Citizen">Senior Citizen</option>
                        <option value="PWD">PWD</option>
                        <option value="Both">Both</option>
                    </select>
                </div>
                <div className="mb-4">
                    <p className="font-semibold mb-2">
                        Select products to discount (20% off each):
                    </p>
                    {order.map((item) => (
                        <div key={item.id} className="flex items-center mb-1">
                            <input
                                type="checkbox"
                                checked={!!discountSelections[item.id]}
                                onChange={(e) =>
                                    setDiscountSelections((prev: { [key: number]: boolean }) => ({
                                        ...prev,
                                        [item.id]: e.target.checked,
                                    }))
                                }
                                className="mr-2"
                            />
                            <span>
                                {item.name} (20%: ₱{(item.price * 0.2).toFixed(2)})
                            </span>
                        </div>
                    ))}
                </div>
                <div className="mb-4">
                    <p className="font-semibold">
                        Total Discount: -₱{calculateDiscountTotal()}
                    </p>
                </div>
                <div className="flex justify-end">
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
                        onClick={onClose}
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DiscountModal; 