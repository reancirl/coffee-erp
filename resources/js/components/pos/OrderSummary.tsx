import React from 'react';
import { Product, primaryColor, secondaryColor, accentColor } from './types';

interface OrderSummaryProps {
    order: Product[];
    onRemoveItem: (product: Product) => void;
    onApplyDiscount: () => void;
    onProceedToPayment: () => void;
    discountSelections: { [key: number]: boolean };
    discountType: string;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
    order,
    onRemoveItem,
    onApplyDiscount,
    onProceedToPayment,
    discountSelections,
    discountType,
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
    const calculateTotal = () => {
        return order.reduce((acc, product) => {
            let itemTotal = safeNumber(product.price);
            
            // Add any add-ons
            if (product.addOns && product.addOns.length > 0) {
                itemTotal += product.addOns.reduce((addOnSum, addOn) => addOnSum + safeNumber(addOn.price), 0);
            }
            
            return acc + itemTotal;
        }, 0).toFixed(2);
    };

    const calculateDiscountTotal = () => {
        return order
            .reduce((acc, item) => (discountSelections[item.id] ? acc + safeNumber(item.price) * 0.2 : acc), 0)
            .toFixed(2);
    };

    const calculateFinalTotal = () => {
        const total = order.reduce((acc, product) => {
            let itemTotal = safeNumber(product.price);
            
            // Add any add-ons
            if (product.addOns && product.addOns.length > 0) {
                itemTotal += product.addOns.reduce((addOnSum, addOn) => addOnSum + safeNumber(addOn.price), 0);
            }
            
            return acc + itemTotal;
        }, 0);
        
        const discount = order.reduce(
            (acc, item) => (discountSelections[item.id] ? acc + safeNumber(item.price) * 0.2 : acc),
            0
        );
        return (total - discount).toFixed(2);
    };

    return (
        <div
            className="lg:w-1/3 w-full p-4 flex flex-col h-full"
            style={{ backgroundColor: primaryColor }}
        >
            <h2 className="text-xl font-semibold mb-2" style={{ color: accentColor }}>
                Order Summary
            </h2>
            
            {/* Scrollable order items section */}
            <div className="flex-grow overflow-auto mb-3" style={{ maxHeight: 'calc(100vh - 340px)' }}>
                {order.length === 0 ? (
                    <p className="text-gray-300">No items added.</p>
                ) : (
                    <ul className="pr-1">
                        {order.map((item) => (
                            <li key={item.id} className="mb-2">
                                {/* Main product */}
                                <div 
                                    className="flex items-center justify-between border-b py-2 cursor-pointer"
                                    style={{ borderColor: secondaryColor }}
                                    onClick={() => onRemoveItem(item)}
                                >
                                    <div className="flex flex-col">
                                        <div className="flex items-center">
                                            <span className="font-bold" style={{ color: accentColor }}>
                                                {item.name}
                                            </span>
                                            {/* Display variant badge if it's in selectedVariant or in customizations */}
                                            {(item.selectedVariant || (item.selectedCustomizations && item.selectedCustomizations['Variant'])) && (
                                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                                                    {item.name.toLowerCase() === 'cookies' 
                                                        ? item.selectedCustomizations?.['Variant'] // For cookies, show the actual variant
                                                        : (item.selectedVariant === 'hot' || item.selectedCustomizations?.['Variant'] === 'Hot' ? 'Hot' : 'Iced') // For other products
                                                    }
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm" style={{ color: accentColor }}>
                                            ₱{formatPrice(item.price)}
                                        </span>
                                        {/* {item.selectedCustomizations && (
                                            <div className="text-xs" style={{ color: accentColor }}>
                                                {Object.entries(item.selectedCustomizations).map(
                                                    ([key, value]) => (
                                                        <div key={key}>
                                                            {key}: {value}
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )} */}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveItem(item);
                                        }}
                                        className="text-red-500 hover:text-red-700 text-2xl font-bold"
                                        style={{ color: accentColor }}
                                        title="Remove item"
                                    >
                                        &times;
                                    </button>
                                </div>

                                {/* Add-ons (if any) */}
                                {item.addOns && item.addOns.length > 0 && (
                                    <ul className="ml-6 mt-1 mb-2">
                                        {item.addOns.map((addOn, index) => {
                                            // Check if this is an alternative milk add-on
                                            const isAltMilk = addOn.is_alternative_milk === true;
                                            const badgeColor = isAltMilk ? 'bg-teal-600' : 'bg-amber-600';
                                            const badgeText = isAltMilk ? 'ALT' : '+';
                                            
                                            return (
                                                <li key={`${item.id}-addon-${index}`} className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <span className={`text-xs ${badgeColor} text-white px-1 py-0.5 rounded-md mr-2`}>
                                                            {badgeText}
                                                        </span>
                                                        <span className="text-sm" style={{ color: accentColor }}>
                                                            {addOn.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm" style={{ color: accentColor }}>
                                                        ₱{formatPrice(addOn.price)}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <button
                className="w-full py-2 mb-4 rounded text-sm font-semibold"
                style={{
                    backgroundColor: secondaryColor,
                    color: accentColor,
                    border: `1px solid ${accentColor}`,
                }}
                onClick={onApplyDiscount}
            >
                Apply Discount
            </button>

            {Object.keys(discountSelections).length > 0 && (
                <div className="mb-4">
                    <p className="font-semibold text-white">
                        {discountType} Discount: -₱{calculateDiscountTotal()}
                    </p>
                </div>
            )}

            <div className="border-t pt-2" style={{ borderColor: secondaryColor }}>
                <div className="flex justify-between font-bold">
                    <span style={{ color: accentColor }}>Original Total:</span>
                    <span style={{ color: accentColor }} className="text-xl">
                        ₱{calculateTotal()}
                    </span>
                </div>
                {Object.keys(discountSelections).length > 0 && (
                    <div className="flex justify-between font-bold">
                        <span style={{ color: accentColor }}>Discount:</span>
                        <span style={{ color: accentColor }} className="text-xl">
                            -₱{calculateDiscountTotal()}
                        </span>
                    </div>
                )}
                <div className="flex justify-between font-bold">
                    <span style={{ color: accentColor }}>Final Total:</span>
                    <span style={{ color: accentColor }} className="text-4xl">
                        ₱{calculateFinalTotal()}
                    </span>
                </div>
                <button
                    className="mt-4 w-full py-2 rounded text-sm font-semibold"
                    style={{
                        backgroundColor: secondaryColor,
                        color: accentColor,
                        border: `1px solid ${accentColor}`,
                    }}
                    onClick={onProceedToPayment}
                >
                    Proceed to Payment
                </button>
            </div>
        </div>
    );
};

export default OrderSummary;