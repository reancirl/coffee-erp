import React, { useState } from 'react';
import { Product, primaryColor, secondaryColor, accentColor } from './types';

interface CustomizationModalProps {
    product: Product;
    onClose: () => void;
    onAddToOrder: (customizations: { [key: string]: string }, variant?: 'hot' | 'iced') => void;
}

const CustomizationModal: React.FC<CustomizationModalProps> = ({ product, onClose, onAddToOrder }) => {
    const [customizationSelections, setCustomizationSelections] = useState<{ [key: string]: string }>({});
    const [selectedVariant, setSelectedVariant] = useState<'hot' | 'iced' | null>(
        product.prices?.hot !== null ? 'hot' : product.prices?.iced !== null ? 'iced' : null
    );
    
    // Auto-proceed logic for add-ons with only one option
    React.useEffect(() => {
        // Check if it's an add-on type and has exactly one customization with only one option
        const isSimpleAddOn = 
            product.type === 'addon' && 
            product.customizations !== undefined && 
            product.customizations.length === 1 && 
            product.customizations[0].options.length === 1;
            
        if (isSimpleAddOn && product.customizations) {
            // Auto-select the only option
            const customization = product.customizations[0];
            const option = customization.options[0];
            setCustomizationSelections({ [customization.name]: option });
            
            // After a brief delay, auto-proceed to add the item
            const timer = setTimeout(() => {
                onAddToOrder({ [customization.name]: option }, selectedVariant || undefined);
            }, 500); // Short delay to allow the user to see what's happening
            
            return () => clearTimeout(timer);
        }
    }, [product, onAddToOrder, selectedVariant]);

    const handleCustomizationChange = (name: string, value: string) => {
        setCustomizationSelections(prev => ({ ...prev, [name]: value }));
        
        // If this is the Variant customization and it's being set to Hot or Iced
        if (name === 'Variant') {
            if (value === 'Hot' || value === 'Iced') {
                setSelectedVariant(value.toLowerCase() as 'hot' | 'iced');
            }
        }
    };

    const handleAddToOrder = () => {
        // Check for required customizations
        const missingRequired = product.customizations?.filter(
            (c) => c.required && !customizationSelections[c.name]
        );
        
        if (missingRequired && missingRequired.length > 0) {
            alert(`Please select: ${missingRequired.map((c) => c.name).join(', ')}`);
            return;
        }

        onAddToOrder(customizationSelections, selectedVariant || undefined);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div
                className="bg-white p-6 rounded shadow-lg w-96"
                style={{ backgroundColor: primaryColor, color: accentColor }}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">
                        {product.type === 'addon' && (
                            <span className="bg-amber-600 text-white px-2 py-0.5 rounded-md text-sm mr-1">
                                ADD-ON
                            </span>
                        )}
                        {product.name}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-300 hover:text-white text-2xl"
                    >
                        &times;
                    </button>
                </div>
                
                {/* Cookie variants selection */}
                {product.name === 'Cookies' && (
                    <div className="mb-4">
                        <label className="block font-semibold mb-2">
                            Cookie Variant *
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Matcha', 'Chocolate', 'Peanut Butter', 'Red Velvet'].map((option) => {
                                const isSelected = customizationSelections['Variant'] === option;
                                return (
                                    <div
                                        key={option}
                                        onClick={() => {
                                            handleCustomizationChange('Variant', isSelected ? '' : option);
                                        }}
                                        className={`p-4 border rounded cursor-pointer text-center ${
                                            isSelected
                                                ? 'bg-blue-500 text-white border-blue-500'
                                                : 'bg-gray-200 text-black'
                                        }`}
                                    >
                                        {option}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                
                {product.name !== 'Cookies' && product.customizations?.map((customization) => {
                    // Auto-select the only option if there's only one and it's required
                    if (customization.options.length === 1 && customization.required && 
                        !customizationSelections[customization.name]) {
                        // Set the only available option as selected
                        setTimeout(() => {
                            handleCustomizationChange(customization.name, customization.options[0]);
                        }, 0);
                        
                        // Show an info message instead of selection UI
                        return (
                            <div key={customization.name} className="mb-4">
                                <label className="block font-semibold mb-2">
                                    {customization.name}
                                </label>
                                <div className="p-2 bg-blue-100 text-blue-800 rounded">
                                    {customization.options[0]} selected automatically
                                </div>
                            </div>
                        );
                    }
                    
                    // For multiple options, show the regular selection UI
                    return (
                        <div key={customization.name} className="mb-4">
                            <label className="block font-semibold mb-2">
                                {customization.name} {customization.required ? '*' : ''}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {customization.options.map((option) => {
                                    const isSelected = customizationSelections[customization.name] === option;
                                    return (
                                        <div
                                            key={option}
                                            onClick={() =>
                                                handleCustomizationChange(
                                                    customization.name,
                                                    isSelected ? '' : option
                                                )
                                            }
                                            className={`p-4 border rounded cursor-pointer text-center ${
                                                isSelected
                                                    ? 'bg-blue-500 text-white border-blue-500'
                                                    : 'bg-gray-200 text-black'
                                            }`}
                                        >
                                            {option}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
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
                        onClick={handleAddToOrder}
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomizationModal; 