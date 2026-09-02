import { Head } from '@inertiajs/react';
import AppLayout, { withAppShell } from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Link, router } from '@inertiajs/react';
import { Fragment, useState } from 'react';

interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    price: number;
    variant: string | null;
    customizations: Record<string, string> | null;
    total: number;
    addOns?: {
        id: number;
        product_name: string;
        quantity: number;
        price: number;
        variant: string | null;
    }[];
}

interface Order {
    id: number;
    order_number: string;
    subtotal: number;
    discount: number;
    total: number;
    payment_method: string;
    payment_status: string;
    cashier: { id: number; name: string } | null;
    status: string;
    order_type: string;
    beeper_number: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    items: OrderItem[];
}

interface ProductOption {
    id: number;
    name: string;
}

type AggregatedItem = OrderItem & { quantity: number };

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
        product?: string;
        order_number?: string;
    };
    products: ProductOption[];
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

export default function Index({ orders, filters, products }: Props) {
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
    const initialProductFilter = filters?.product || '';
    const initialOrderNumber = filters?.order_number || '';
    const [startDate, setStartDate] = useState<string>(initialDates.start);
    const [endDate, setEndDate] = useState<string>(initialDates.end);
    const [productQuery, setProductQuery] = useState<string>(initialProductFilter);
    const [orderNumberQuery, setOrderNumberQuery] = useState<string>(initialOrderNumber);
    const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
    const [showProductSuggestions, setShowProductSuggestions] = useState(false);
    
    const trimmedProductQuery = productQuery.toLowerCase().trim();
    const filteredProducts = products.filter((product) => {
        if (!trimmedProductQuery) return true;
        return product.name.toLowerCase().includes(trimmedProductQuery) || product.id.toString().includes(trimmedProductQuery);
    });
    
    // Handle filter application
    const applyFilter = () => {
        router.get('/orders', {
            start_date: startDate,
            end_date: endDate,
            product: productQuery || undefined,
            order_number: orderNumberQuery || undefined,
        }, {
            preserveState: true,
        });
    };
    
    // Reset filters
    const resetFilter = () => {
        const today = new Date();
        
        setStartDate(formatDateForInput(today));
        setEndDate(formatDateForInput(today));
        setProductQuery('');
        setOrderNumberQuery('');
        
        router.get('/orders', {}, {
            preserveState: true,
        });
    };

    const toggleExpanded = (orderId: number) => {
        setExpandedOrders((prev) => {
            const next = new Set(prev);
            if (next.has(orderId)) {
                next.delete(orderId);
            } else {
                next.add(orderId);
            }
            return next;
        });
    };

    const normalizeCustomizations = (customizations: Record<string, string> | null) => {
        if (!customizations) return '';
        const entries = Object.entries(customizations).sort(([a], [b]) => a.localeCompare(b));
        return JSON.stringify(entries);
    };

    const normalizeAddOns = (addOns: OrderItem['addOns'] | undefined) => {
        if (!addOns || addOns.length === 0) return '';
        const summarized = addOns
            .map((addon) => ({
                name: addon.product_name,
                quantity: addon.quantity ?? 1,
                variant: addon.variant || '',
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
        return JSON.stringify(summarized);
    };

    const aggregateOrderItems = (items: OrderItem[]): AggregatedItem[] => {
        const map = new Map<string, AggregatedItem>();

        items.forEach((item) => {
            const key = [
                item.product_name,
                item.variant || '',
                normalizeCustomizations(item.customizations),
                normalizeAddOns(item.addOns),
            ].join('||');

            if (map.has(key)) {
                const existing = map.get(key)!;
                existing.quantity += item.quantity;
            } else {
                map.set(key, { ...item });
            }
        });

        return Array.from(map.values());
    };
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Orders" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl bg-card/60 p-6 text-sm shadow-sm lg:p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-xl font-bold">Orders</h2>
                        <p className="text-xs text-muted-foreground">
                            {orders.meta.total} {orders.meta.total === 1 ? 'order' : 'orders'} found
                            {(filters?.start_date || filters?.end_date || filters?.product) && ' with current filters'}
                        </p>
                    </div>
                    
                    {/* Filters */}
                    <div className="w-full rounded-2xl border border-border bg-card/80 p-4 shadow-lg ring-1 ring-black/5">
                        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            <div className="flex flex-col">
                                <label htmlFor="start-date" className="mb-1 text-xs font-semibold text-foreground">From</label>
                                <input 
                                    type="date" 
                                    id="start-date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="end-date" className="mb-1 text-xs font-semibold text-foreground">To</label>
                                <input 
                                    type="date" 
                                    id="end-date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="order-number" className="mb-1 text-xs font-semibold text-foreground">Order #</label>
                                <input
                                    type="search"
                                    id="order-number"
                                    value={orderNumberQuery}
                                    onChange={(e) => setOrderNumberQuery(e.target.value)}
                                    autoComplete="off"
                                    placeholder="Search order number"
                                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="product" className="mb-1 text-xs font-semibold text-foreground">Product</label>
                                <div className="relative">
                                    <input
                                        type="search"
                                        id="product"
                                        value={productQuery}
                                        onChange={(e) => {
                                            setProductQuery(e.target.value);
                                            setShowProductSuggestions(true);
                                        }}
                                        onFocus={() => setShowProductSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowProductSuggestions(false), 150)}
                                        autoComplete="off"
                                        placeholder="Enter product name or ID"
                                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                    {showProductSuggestions && (productQuery.trim().length > 0 || products.length > 0) && (
                                        <div className="absolute z-10 mt-1 w-full rounded-xl border border-border bg-card shadow-lg">
                                            <div className="max-h-64 overflow-y-auto py-1 text-sm">
                                                {filteredProducts.slice(0, 8).map((product) => (
                                                    <button
                                                        key={product.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setProductQuery(product.name);
                                                            setShowProductSuggestions(false);
                                                        }}
                                                        className="flex w-full items-center justify-between px-3 py-2 text-left text-foreground hover:bg-primary/10"
                                                    >
                                                        <span className="font-medium">{product.name}</span>
                                                        <span className="text-xs text-muted-foreground">#{product.id}</span>
                                                    </button>
                                                ))}
                                                {filteredProducts.length === 0 && (
                                                    <div className="px-3 py-2 text-xs text-muted-foreground">No matches found</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-end gap-2 pt-2 lg:justify-end">
                                <button 
                                    onClick={applyFilter}
                                    className="cursor-pointer rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                                >
                                    Filter
                                </button>
                                <button 
                                    onClick={resetFilter}
                                    className="cursor-pointer rounded-xl border border-border bg-card px-5 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary hover:text-primary"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-card overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 text-foreground">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border text-sm">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Order #</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Items</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cashier</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-border">
                                    {orders.data.map((order) => {
                                        const isExpanded = expandedOrders.has(order.id);
                                        return (
                                            <Fragment key={order.id}>
                                                <tr>
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
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <button
                                                            onClick={() => toggleExpanded(order.id)}
                                                            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
                                                        >
                                                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                                                            <span className={`text-xs transition-transform ${isExpanded ? 'rotate-90' : 'rotate-0'}`}>&gt;</span>
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                                                        {formatCurrency(order.total)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{order.payment_method}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {order.cashier?.name ?? <span className="text-muted-foreground">&mdash;</span>}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                            ${order.status === 'completed' ? 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300' : 
                                                              order.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300' : 
                                                              'bg-muted text-foreground'}`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <Link
                                                            href={route('orders.show', order.id)}
                                                            className="cursor-pointer text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-200"
                                                        >
                                                            View
                                                        </Link>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr className="bg-muted">
                                                        <td colSpan={9} className="px-6 py-4">
                                                            <div className="flex flex-col gap-3">
                                                                {aggregateOrderItems(order.items).map((item) => (
                                                                    <div key={item.id} className="rounded-lg border border-border bg-card/80 p-3 shadow-sm">
                                                                        <div className="flex items-start justify-between">
                                                                            <div className="font-semibold text-foreground">{item.product_name}</div>
                                                                            <div className="text-xs text-muted-foreground">x{item.quantity}</div>
                                                                        </div>
                                                                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                                            {item.variant && <span className="rounded-full bg-muted px-2 py-0.5">Variant: {item.variant}</span>}
                                                                            {item.customizations && Object.keys(item.customizations).length > 0 && (
                                                                                <span className="rounded-full bg-muted px-2 py-0.5">
                                                                                    {Object.entries(item.customizations).map(([key, value]) => `${key}: ${value}`).join(' • ')}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {item.addOns && item.addOns.length > 0 && (
                                                                            <div className="mt-2 rounded-lg border border-border bg-muted p-2 text-xs text-foreground">
                                                                                <div className="mb-1 font-semibold text-foreground">Add-ons</div>
                                                                                <ul className="list-disc space-y-1 pl-4">
                                                                                    {item.addOns.map((addon) => (
                                                                                        <li key={addon.id} className="flex items-center justify-between">
                                                                                            <span>{addon.product_name}</span>
                                                                                            <span className="text-muted-foreground">x{addon.quantity ?? 1}</span>
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
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
                                                end_date: endDate,
                                                product: productQuery || undefined,
                                                order_number: orderNumberQuery || undefined
                                            })}
                                            className="cursor-pointer rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
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
                                                end_date: endDate,
                                                product: productQuery || undefined,
                                                order_number: orderNumberQuery || undefined
                                            })}
                                            className="cursor-pointer rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
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

Index.layout = withAppShell;
