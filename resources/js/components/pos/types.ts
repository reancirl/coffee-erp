export type Customization = {
    name: string;
    options: string[];
    required?: boolean;
};

export interface Product {
    id: number;
    name: string;
    price: number;
    prices?: {
        hot: number | null;
        iced: number | null;
    };
    selectedVariant?: 'hot' | 'iced';
    selectedCustomizations?: { [key: string]: string };
    customizations?: Customization[];
    addOns?: Product[];
    isAddOn?: boolean;
    type?: 'product' | 'addon';
    is_alternative_milk?: boolean; // For distinguishing alternative milk products with teal styling
};

export type ProductCategory = {
    name: string;
    products: Product[];
};

export type MenuData = {
    [category: string]: Array<{
        name: string;
        id: number;
        price?: number;
        prices?: {
            hot: number | null;
            iced: number | null;
        };
        type?: 'product' | 'addon';
        is_alternative_milk?: boolean; // For alternative milk styling
        customizations?: Customization[]; // Support for variant options in cookies and other items
    }>;
};

export const primaryColor = '#3b3b3b';
export const secondaryColor = '#6c6c6c';
export const accentColor = '#e0e0e0'; 