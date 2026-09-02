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
    // Helper function to safely convert any value to a number
    const safeNumber = (value: any): number => {
        if (value === undefined || value === null) return 0;
        const num = Number(value);
        return isNaN(num) ? 0 : num;
    };
    
    // Helper function for safe price formatting
    const formatPrice = (price: any): string => {
        return safeNumber(price).toFixed(2);
    };
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div 
                className="bg-card p-6 rounded shadow-lg w-96"
                style={{ backgroundColor: primaryColor, color: accentColor }}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">
                        Add <span className="bg-amber-600 text-white px-2 py-0.5 rounded-md text-sm mr-1">ADD-ON</span> 
                        {addOn.name} to:
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-muted-foreground hover:text-white text-2xl"
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
                                className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                            >
                                <div className="flex justify-between items-center">
                                    <span>
                                        {item.name}
                                        {item.selectedVariant && (
                                            <span className="ml-2 text-sm px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300">
                                                {item.selectedVariant === 'hot' ? 'Hot' : 'Iced'}
                                            </span>
                                        )}
                                    </span>
                                    <span>₱{formatPrice(item.price)}</span>
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
                        className="px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddOnModal;
