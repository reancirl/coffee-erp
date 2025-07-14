import React from 'react';
import { Product, secondaryColor, accentColor } from './types';

interface ProductCategoryProps {
    title: string;
    products: Product[];
    onProductClick: (product: Product) => void;
}

const ProductCategory: React.FC<ProductCategoryProps> = ({ title, products, onProductClick }) => {
    // Safe price formatting helper
    const formatPrice = (price: any): string => {
        // Handle case where price is undefined, null, or not a number
        if (price === undefined || price === null || isNaN(Number(price))) {
            return '0.00';
        }
        return Number(price).toFixed(2);
    };

    return (
        <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2" style={{ color: accentColor }}>
                {title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((product) => {
                    // Determine if this is an add-on or alternative milk
                    const isAddOn = product.type === 'addon';
                    const isAltMilk = isAddOn && product.is_alternative_milk === true;
                    
                    // Set appropriate styling based on product type
                    const borderStyle = isAltMilk ? 
                        'border-2 border-teal-500' : 
                        isAddOn ? 'border-2 border-amber-500' : '';
                    
                    return (
                        <div
                            key={product.id}
                            className={`p-4 rounded cursor-pointer relative ${borderStyle}`}
                            style={{ backgroundColor: secondaryColor, color: accentColor }}
                            onClick={() => onProductClick(product)}
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold">{product.name}</h3>
                                
                                {/* Display badge for add-ons */}
                                {isAddOn && (
                                    <span className={`text-xs px-1 py-0.5 rounded ${isAltMilk ? 'bg-teal-500' : 'bg-amber-500'} text-white`}>
                                        {isAltMilk ? 'ALT MILK' : 'ADD-ON'}
                                    </span>
                                )}
                            </div>
                            <p>₱{formatPrice(product.price)}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProductCategory; 