import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    price: number;
    variant: string | null;
    customizations: Record<string, string> | null;
    total: number;
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
    orders: {
        data: Order[];
        meta: {
            current_page: number;
            last_page: number;
            total: number;
        }
    };
    filters?: {
        start_date?: string;
        end_date?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Orders',
        href: '/orders',
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

export default function Index({ orders, filters }: Props) {
    // Format date to YYYY-MM-DD for input type="date"
    const formatDateForInput = (date: Date) => {
        return date.toISOString().split('T')[0];
    };
    
    // Initialize dates with filters from backend or defaults
    const initializeDates = () => {
        const today = new Date();
        
        const defaultStartDate = formatDateForInput(today);
        const defaultEndDate = formatDateForInput(today);
        
        return {
            start: filters?.start_date || defaultStartDate,
            end: filters?.end_date || defaultEndDate
        };
    };
    
    const initialDates = initializeDates();
    const [startDate, setStartDate] = useState<string>(initialDates.start);
    const [endDate, setEndDate] = useState<string>(initialDates.end);
    
    // Handle filter application
    const applyFilter = () => {
        router.get('/orders', {
            start_date: startDate,
            end_date: endDate,
        }, {
            preserveState: true,
        });
    };
    
    // Reset filters
    const resetFilter = () => {
        const today = new Date();
        
        setStartDate(formatDateForInput(today));
        setEndDate(formatDateForInput(today));
        
        router.get('/orders', {}, {
            preserveState: true,
        });
    };
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Orders" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Orders</h2>
                        <p className="text-sm text-gray-600">
                            {orders.meta.total} {orders.meta.total === 1 ? 'order' : 'orders'} found
                            {(filters?.start_date || filters?.end_date) && ' with current filters'}
                        </p>
                    </div>
                    
                    {/* Date Filter */}
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                            <label htmlFor="start-date" className="mr-1 text-sm font-medium">From:</label>
                            <input 
                                type="date" 
                                id="start-date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border rounded p-1 text-sm"
                            />
                        </div>
                        <div className="flex items-center">
                            <label htmlFor="end-date" className="mr-1 text-sm font-medium">To:</label>
                            <input 
                                type="date" 
                                id="end-date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="border rounded p-1 text-sm"
                            />
                        </div>
                        <button 
                            onClick={applyFilter}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
                        >
                            Filter
                        </button>
                        <button 
                            onClick={resetFilter}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-1 px-3 rounded text-sm"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 text-gray-900">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.data.map((order) => (
                                        <tr key={order.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{order.order_number}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {new Date(order.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {order.order_type}
                                                {order.beeper_number && ` (#${order.beeper_number})`}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{order.items.length}</td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium">
                                                {formatCurrency(order.total)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{order.payment_method}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                                      'bg-gray-100 text-gray-800'}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <Link
                                                    href={route('orders.show', order.id)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination */}
                        {orders.meta.last_page > 1 && (
                            <div className="mt-4 flex justify-between items-center">
                                <div>
                                    Showing {orders.meta.current_page} of {orders.meta.last_page} pages
                                </div>
                                <div className="flex space-x-2">
                                    {orders.meta.current_page > 1 && (
                                        <Link
                                            href={route('orders.index', { 
                                                page: orders.meta.current_page - 1,
                                                start_date: startDate,
                                                end_date: endDate
                                            })}
                                            className="px-4 py-2 bg-gray-200 rounded"
                                            preserveState
                                        >
                                            Previous
                                        </Link>
                                    )}
                                    {orders.meta.current_page < orders.meta.last_page && (
                                        <Link
                                            href={route('orders.index', { 
                                                page: orders.meta.current_page + 1,
                                                start_date: startDate,
                                                end_date: endDate
                                            })}
                                            className="px-4 py-2 bg-gray-200 rounded"
                                            preserveState
                                        >
                                            Next
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
