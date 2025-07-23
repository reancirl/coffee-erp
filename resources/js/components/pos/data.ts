import { MenuData } from './types';

// Use simple incremental IDs starting from 1
let productId = 1;

const generateId = () => productId++;

export const menuData: MenuData = {
    "Coffee": [
        { name: "Espresso", prices: { hot: 95, iced: null }, type: 'product' },
        { name: "Americano", prices: { hot: 125, iced: 125 }, type: 'product' },
        { name: "Double Americano", prices: { hot: 140, iced: 140 }, type: 'product' },
        { name: "Latte", prices: { hot: 145, iced: 145 }, type: 'product' },
        { name: "Cappuccino", prices: { hot: 155, iced: 155 }, type: 'product' },
        { name: "Caramel Macchiato", prices: { hot: 180, iced: 180 }, type: 'product' },
        { name: "Salted Caramel", prices: { hot: 170, iced: 170 }, type: 'product' },
        { name: "Spanish Latte", prices: { hot: 155, iced: 155 }, type: 'product' },
        { name: "White Mocha", prices: { hot: 165, iced: 165 }, type: 'product' },
        { name: "Mocha", prices: { hot: 165, iced: 165 }, type: 'product' },
        { name: "Biscoff Latte", prices: { hot: null, iced: 215 }, type: 'product' },
        { name: "Dirty Matcha", prices: { hot: 190, iced: 190 }, type: 'product' },
        { name: "Dirty Horchata", prices: { hot: 220, iced: 220 }, type: 'product' }
    ],
    "Blended Drinks": [
        { name: "Java Chip Frappe", price: 200, type: 'product' },
        { name: "Strawberry Milkshake", price: 180, type: 'product' },
        { name: "Oreo Milkshake", price: 150, type: 'product' },
        { name: "Chocolate Milkshake", price: 175, type: 'product' }
    ],
    "River Fizz": [
        { name: "Green Apple Fizzy", price: 135, type: 'product' },
        { name: "Strawberry Fizzy", price: 135, type: 'product' },
        { name: "Raspberry Fizzy", price: 135, type: 'product' },
        { name: "Passion Fruit Fizzy", price: 135, type: 'product' },
        { name: "Kiwi Fizzy", price: 135, type: 'product' }
    ],
    "Black Trails": [
        { name: "Green Apple Tea", price: 145, type: 'product' },
        { name: "Strawberry Tea", price: 145, type: 'product' },
        { name: "Raspberry Tea", price: 145, type: 'product' },
        { name: "Passion Fruit Tea", price: 145, type: 'product' },
        { name: "Kiwi Tea", price: 145, type: 'product' }
    ],
    "Greens & Grains": [
        { name: "Matcha Latte", prices: { hot: 160, iced: 160 }, type: 'product' },
        { name: "Matchata", prices: { hot: 210, iced: 210 }, type: 'product' },
        { name: "Horchata", prices: { hot: 175, iced: 175 }, type: 'product' },
        { name: "Strawberry Matcha", prices: { hot: null, iced: 165 }, type: 'product' },
        { name: "Earl Grey", price: 90, type: 'product' },
        { name: "Green Tea", price: 90, type: 'product' }
    ],
    "Add-Ons": [
        { name: "Espresso", price: 30, type: 'addon' }
    ],
    "Alternative Milk": [
        { name: "Oat Milk", price: 40, type: 'addon' }
    ]
};

// Convert menu data to the old format for backward compatibility
export const coffee = menuData["Coffee"].map(item => ({
    id: generateId(),
    name: item.name,
    price: item.prices?.hot || item.prices?.iced || 0,
    prices: item.prices,
    customizations: item.prices ? [
        { name: 'Variant', options: [
            ...(item.prices.hot !== null ? ['Hot'] : []),
            ...(item.prices.iced !== null ? ['Iced'] : [])
        ], required: true }
    ] : undefined
}));

// Combine all non-coffee drinks
export const nonCoffee = [
    ...menuData["Blended Drinks"],
    ...menuData["River Fizz"],
    ...menuData["Black Trails"],
    ...menuData["Greens & Grains"].filter(item => item.price)
].map(item => ({
    id: generateId(),
    name: item.name,
    price: item.price || 0
}));

// Helper function to check if a product is an add-on
export const isAddOn = (product: any): boolean => {
    // Primary check: use the explicit type property
    if (product.type !== undefined) {
        return product.type === 'addon';
    }
    
    // Fallback: use name-based detection for backward compatibility
    // List of known add-on product names
    const knownAddOns = ['Oat Milk', 'Espresso', 'Extra Shot', 'Vanilla Syrup', 'Caramel Syrup'];
    return knownAddOns.includes(product.name);
};

export const paymentMethods = [
    { id: 'cash', name: 'Cash' },
    { id: 'g-cash', name: 'GCash' },
    { id: 'split', name: 'Split (Cash + GCash)' },
    { id: 'debit', name: 'Debit Card' },
    { id: 'pmna', name: 'PMNA Card' },
];