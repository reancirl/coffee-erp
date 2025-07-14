import React from 'react';
import { Product, secondaryColor, accentColor } from './types';

interface ProductCategoryProps {
    title: string;
    products: Product[];
    onProductClick: (product: Product) => void;
}

const ProductCategory: React.FC<ProductCategoryProps> = ({ title, products, onProductClick }) => {
    return (
        <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2" style={{ color: accentColor }}>
                {title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((product) => (
                    <div
                        key={product.id}
                        className="p-4 rounded cursor-pointer"
                        style={{ backgroundColor: secondaryColor, color: accentColor }}
                        onClick={() => onProductClick(product)}
                    >
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold">{product.name}</h3>
                        </div>
                        <p>₱{product.price.toFixed(2)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductCategory; 