import React from 'react';
import { Product, primaryColor, accentColor } from './types';

interface AddOnModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderItems: Array<Product & { id: number }>;
    addOn: Product;
    onSelectItem: (itemId: number) => void;
}

const AddOnModal: React.FC<AddOnModalProps> = ({ 
    isOpen, 
    onClose, 
    orderItems,
    addOn,
    onSelectItem 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div 
                className="bg-white p-6 rounded shadow-lg w-96"
                style={{ backgroundColor: primaryColor, color: accentColor }}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">
                        Add <span className="bg-amber-600 text-white px-2 py-0.5 rounded-md text-sm mr-1">ADD-ON</span> 
                        {addOn.name} to:
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-300 hover:text-white text-2xl"
                    >
                        &times;
                    </button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {orderItems.length > 0 ? (
                        orderItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onSelectItem(item.id)}
                                className="w-full text-left p-3 rounded-lg hover:bg-gray-100 hover:bg-opacity-20 transition-colors"
                            >
                                <div className="flex justify-between items-center">
                                    <span>
                                        {item.name}
                                        {item.selectedVariant && (
                                            <span className="ml-2 text-sm px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                                {item.selectedVariant === 'hot' ? 'Hot' : 'Iced'}
                                            </span>
                                        )}
                                    </span>
                                    <span>₱{item.price.toFixed(2)}</span>
                                </div>
                            </button>
                        ))
                    ) : (
                        <p>No items in the order to add {addOn.name} to.</p>
                    )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddOnModal;
