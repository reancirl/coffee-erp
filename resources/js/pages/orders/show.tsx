import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface OrderAddOn {
    id: number;
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    variant: string | null;
    customizations: Record<string, string> | null;
}

interface OrderItem {
    id: number;
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    variant: string | null;
    customizations: Record<string, string> | null;
    total: number;
    addOns: OrderAddOn[];
}

interface Order {
    id: number;
    order_number: string;
    subtotal: number;
    discount: number;
    total: number;
    payment_method: string;
    payment_status: string;
    status: string;
    order_type: string;
    beeper_number: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    items: OrderItem[];
}

interface Props {
    order: Order;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Orders',
        href: '/orders',
    },
    {
        title: 'Order Details',
        href: '',
    },
];

// Helper function to format currency
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2
    }).format(amount);
};

export default function Show({ order }: Props) {
    const [showVoidConfirm, setShowVoidConfirm] = useState(false);
    const [isVoiding, setIsVoiding] = useState(false);
    
    // Handle void order
    const handleVoidOrder = () => {
        if (isVoiding) return;
        
        setIsVoiding(true);
        router.patch(route('orders.void', order.id), {}, {
            onSuccess: () => {
                setShowVoidConfirm(false);
                setIsVoiding(false);
            },
            onError: () => {
                setIsVoiding(false);
            }
        });
    };
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Order ${order.order_number}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Order {order.order_number}</h2>
                    <div className="flex space-x-2">
                        {order.status !== 'voided' && (
                            <button
                                onClick={() => setShowVoidConfirm(true)}
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                disabled={isVoiding}
                            >
                                {isVoiding ? 'Processing...' : 'Void Order'}
                            </button>
                        )}
                        <Link
                            href={route('orders.index')}
                            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Back to Orders
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Order Information */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h3 className="text-lg font-semibold mb-4">Order Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Order Number</p>
                                    <p className="font-medium">{order.order_number}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Date</p>
                                    <p className="font-medium">{new Date(order.created_at).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <p className="font-medium">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                              'bg-gray-100 text-gray-800'}`}>
                                            {order.status}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Payment</p>
                                    <p className="font-medium">{order.payment_method}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Order Type</p>
                                    <p className="font-medium">{order.order_type}</p>
                                </div>
                                {order.beeper_number && (
                                    <div>
                                        <p className="text-sm text-gray-500">Beeper Number</p>
                                        <p className="font-medium">#{order.beeper_number}</p>
                                    </div>
                                )}
                                {order.notes && (
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-500">Notes</p>
                                        <p className="font-medium">{order.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(order.subtotal)}</span>
                                </div>
                                {order.discount > 0 && (
                                    <div className="flex justify-between text-red-500">
                                        <span>Discount:</span>
                                        <span>-{formatCurrency(order.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold border-t pt-2">
                                    <span>Total:</span>
                                    <span>{formatCurrency(order.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 text-gray-900">
                        <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variant</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {order.items.map((item) => (
                                        <>
                                            <tr key={item.id} className="bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium">{item.product_name}</div>
                                                    {item.customizations && (
                                                        <div className="text-sm text-gray-500">
                                                            {Object.entries(item.customizations)
                                                                .filter(([key]) => key !== 'Variant') // Exclude Variant as it's shown separately
                                                                .map(([key, value]) => (
                                                                    <div key={key}>{key}: {value}</div>
                                                                ))
                                                            }
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.variant === 'hot' || 
                                                     (item.customizations && item.customizations['Variant'] === 'Hot') 
                                                        ? 'Hot' 
                                                        : item.variant === 'iced' || 
                                                          (item.customizations && item.customizations['Variant'] === 'Iced')
                                                            ? 'Iced'
                                                            : '-'
                                                    }
                                                </td>
                                                <td className="px-6 py-4">{formatCurrency(item.price)}</td>
                                                <td className="px-6 py-4">{item.quantity}</td>
                                                <td className="px-6 py-4 font-medium">{formatCurrency(item.price * item.quantity)}</td>
                                            </tr>
                                            {/* Add-ons for this item */}
                                            {item.addOns && item.addOns.length > 0 && item.addOns.map((addon) => (
                                                <tr key={`${item.id}-addon-${addon.id}`} className="text-gray-500 bg-gray-100">
                                                    <td className="px-6 py-2 pl-10 italic">{addon.product_name} (Add-on)</td>
                                                    <td className="px-6 py-2">
                                                        {addon.variant === 'hot' ? 'Hot' : 
                                                         addon.variant === 'iced' ? 'Iced' : '-'}
                                                    </td>
                                                    <td className="px-6 py-2">{formatCurrency(addon.price)}</td>
                                                    <td className="px-6 py-2">{addon.quantity || 1}</td>
                                                    <td className="px-6 py-2">{formatCurrency(addon.price * (addon.quantity || 1))}</td>
                                                </tr>
                                            ))}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Void Confirmation Modal */}
            {showVoidConfirm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">Void Order</h3>
                        <p className="mb-6 text-gray-700">
                            Are you sure you want to void this order? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowVoidConfirm(false)}
                                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
                                disabled={isVoiding}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleVoidOrder}
                                className="px-4 py-2 bg-red-500 hover:bg-red-700 text-white rounded"
                                disabled={isVoiding}
                            >
                                {isVoiding ? 'Processing...' : 'Void Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
