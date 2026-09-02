import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import React, { useCallback, useMemo } from 'react';
import { useChartPalette } from '@/components/theme-provider';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    BarElement,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

// Define the props interface for the data passed from the controller
interface SalesData {
    rangeSales: number;
    totalCups: number;
    totalCupsThisWeek: number;
    productCounts: Record<string, number>;
    foodProductCounts: Record<string, number>;
    totalFoodItems: number;
    foodSales: number;
    categoryBreakdown: Array<{category: string; sales: number; quantity: number}>;
    dailySales: Array<{date: string; sales: number}>;
    dailyCups: Array<{date: string, cups: number}>;
    startDate: string;
    endDate: string;
}

interface DashboardProps {
    salesData: SalesData;
}

// Helper function to format currency
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2
    }).format(amount);
};

// Color codes for different categories
const categoryColors: Record<string, string> = {
    'Coffee': 'bg-amber-700',
    'Blended Drinks': 'bg-blue-600',
    'River Fizz': 'bg-teal-600',
    'Black Trails': 'bg-gray-500',
    'Greens & Grains': 'bg-green-600'
};

// Card component for stats
const StatCard = ({ title, value, icon, color }: { title: string; value: string; icon?: string; color?: string }) => (
    <div className="bg-card p-5 rounded-xl shadow-md border border-border flex flex-col text-sm">
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-muted-foreground text-xs uppercase font-semibold">{title}</h3>
            {icon && (
                <div className={`${color || 'bg-blue-500'} p-2 rounded-full text-white`}>
                    <span className="text-xl">{icon}</span>
                </div>
            )}
        </div>
    <div className="text-2xl font-bold text-foreground">{value}</div>
</div>
);

// Product cup count component
const ProductCupCount = ({ 
    product, 
    count, 
    totalCups,
    index,
    unitLabel = 'cups'
}: { 
    product: string; 
    count: number; 
    totalCups: number;
    index: number;
    unitLabel?: string;
}) => {
    const percentage = totalCups > 0 ? Math.round((count / totalCups) * 100) : 0;
    // Rotate through colors
    const colors = Object.values(categoryColors);
    const colorClass = colors[index % colors.length];
    
    return (
        <div className="mb-4">
            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{product}</span>
                <span className="text-sm text-muted-foreground">{count} {unitLabel} ({percentage}%)</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
                <div 
                    className={`${colorClass} h-2.5 rounded-full`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

export default function Dashboard({ salesData }: DashboardProps) {
    const { 
        rangeSales, 
        totalCups, 
        totalCupsThisWeek, 
        productCounts, 
        foodProductCounts,
        totalFoodItems,
        foodSales,
        categoryBreakdown,
        dailySales,
        dailyCups, 
        startDate, 
        endDate 
    } = salesData;
    
    // Form for date filtering
    const { data, setData, get, processing } = useForm({
        start_date: startDate,
        end_date: endDate,
    });
    
    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        get('/dashboard');
    };
    
    // Format date range for display
    const dateRangeText = startDate === endDate 
        ? `${new Date(startDate).toLocaleDateString()}` 
        : `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
    
    // Sort products by cup count (descending)
    const sortedProducts = Object.entries(productCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .map(([product, count]) => ({ product, count }));

    // Sort food/pastry items
    const sortedFoodProducts = Object.entries(foodProductCounts || {})
        .sort(([, countA], [, countB]) => countB - countA)
        .map(([product, count]) => ({ product, count }));

    // Chart.js paints to a canvas, so axes, gridlines and tooltips cannot pick
    // up a `dark:` utility — they read the resolved theme instead.
    const palette = useChartPalette();

    const chartBase = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' as const, labels: { color: palette.tick } },
                tooltip: {
                    backgroundColor: palette.tooltipBackground,
                    titleColor: palette.tooltipText,
                    bodyColor: palette.tooltipText,
                    borderColor: palette.border,
                    borderWidth: 1,
                },
            },
        }),
        [palette],
    );

    const axis = useCallback(
        (title?: string, ticks: Record<string, unknown> = {}) => ({
            ...(title ? { title: { display: true, text: title, color: palette.tick } } : {}),
            ticks: { color: palette.tick, ...ticks },
            grid: { color: palette.grid },
            border: { color: palette.border },
        }),
        [palette],
    );
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-5 rounded-xl bg-card/60 p-6 text-sm shadow-sm lg:p-8">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <h1 className="text-xl font-bold text-foreground">Sales Overview: {dateRangeText}</h1>
                    
                    {/* Date Filter Form */}
                    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <label htmlFor="start_date" className="text-xs font-semibold text-foreground">From:</label>
                            <input 
                                type="date" 
                                id="start_date"
                                value={data.start_date}
                                onChange={e => setData('start_date', e.target.value)}
                                className="rounded-lg border border-border px-2 py-1 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm text-foreground"
                            />
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <label htmlFor="end_date" className="text-xs font-semibold text-foreground">To:</label>
                            <input 
                                type="date" 
                                id="end_date"
                                value={data.end_date}
                                onChange={e => setData('end_date', e.target.value)}
                                className="rounded-lg border border-border px-2 py-1 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm text-foreground"
                            />
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={processing}
                            className="inline-flex justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-75 cursor-pointer"
                        >
                            Filter
                        </button>
                    </form>
                </div>
                
                {/* Today's sales stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6">
                    <StatCard 
                        title="Total Sales" 
                        value={formatCurrency(rangeSales)}
                        icon="💰"
                        color="bg-green-600"
                    />
                    <StatCard 
                        title="Total Cups Served" 
                        value={`${totalCups}`}
                        icon="☕"
                        color="bg-amber-600"
                    />
                    <StatCard 
                        title="Food & Pastry Items" 
                        value={`${totalFoodItems}`}
                        icon="🥐"
                        color="bg-orange-500"
                    />
                    <StatCard 
                        title="Food & Pastry Sales" 
                        value={formatCurrency(foodSales)}
                        icon="🍽️"
                        color="bg-indigo-600"
                    />
                </div>
                
                {/* Daily Trends */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    <div className="bg-card p-5 rounded-xl shadow-md border border-border">
                        <h2 className="text-base font-semibold mb-3 text-foreground">Daily Cups Served</h2>
                        {dailyCups.length > 0 ? (
                            <div style={{ height: '300px' }}>
                                <Line
                                    options={{
                                        ...chartBase,
                                        plugins: {
                                            ...chartBase.plugins,
                                            tooltip: {
                                                ...chartBase.plugins.tooltip,
                                                callbacks: {
                                                    label: function(context) {
                                                        return `${context.parsed.y} cups`;
                                                    }
                                                }
                                            }
                                        },
                                        scales: {
                                            y: {
                                                ...axis('Cups Served', { precision: 0 }),
                                                beginAtZero: true,
                                            },
                                            x: axis('Date')
                                        }
                                    }}
                                    data={{
                                        labels: dailyCups.map(day => {
                                            const date = new Date(day.date);
                                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                        }),
                                        datasets: [
                                            {
                                                label: 'Cups Served',
                                                data: dailyCups.map(day => day.cups),
                                                borderColor: 'rgb(153, 102, 51)',
                                                backgroundColor: 'rgba(153, 102, 51, 0.5)',
                                                tension: 0.3,
                                                pointRadius: 5,
                                                pointHoverRadius: 7,
                                            },
                                        ],
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">No data available for the selected date range</div>
                        )}
                    </div>
                    
                    <div className="bg-card p-5 rounded-xl shadow-md border border-border">
                        <h2 className="text-base font-semibold mb-3 text-foreground">Daily Sales</h2>
                        {dailySales.length > 0 ? (
                            <div style={{ height: '300px' }}>
                                <Line
                                    options={{
                                        ...chartBase,
                                        plugins: {
                                            ...chartBase.plugins,
                                            tooltip: {
                                                ...chartBase.plugins.tooltip,
                                                callbacks: {
                                                    label: function(context) {
                                                        const value = context.parsed.y || 0;
                                                        return formatCurrency(value);
                                                    }
                                                }
                                            }
                                        },
                                        scales: {
                                            y: {
                                                ...axis('Sales (PHP)', {
                                                    callback: function(value: string | number) {
                                                        return `₱${value}`;
                                                    }
                                                }),
                                                beginAtZero: true,
                                            },
                                            x: axis('Date')
                                        }
                                    }}
                                    data={{
                                        labels: dailySales.map(day => {
                                            const date = new Date(day.date);
                                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                        }),
                                        datasets: [
                                            {
                                                label: 'Sales',
                                                data: dailySales.map(day => day.sales),
                                                borderColor: 'rgb(79, 70, 229)',
                                                backgroundColor: 'rgba(79, 70, 229, 0.5)',
                                                tension: 0.3,
                                                pointRadius: 5,
                                                pointHoverRadius: 7,
                                            },
                                        ],
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">No data available for the selected date range</div>
                        )}
                    </div>
                </div>
                
                {/* Category Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    <div className="bg-card p-5 rounded-xl shadow-md border border-border">
                        <h2 className="text-base font-semibold mb-3 text-foreground">Sales by Category</h2>
                        {categoryBreakdown.length > 0 ? (
                            <div style={{ height: '300px' }}>
                                <Bar 
                                    options={{
                                        ...chartBase,
                                        plugins: {
                                            ...chartBase.plugins,
                                            tooltip: {
                                                ...chartBase.plugins.tooltip,
                                                callbacks: {
                                                    label: function(context) {
                                                        return formatCurrency(context.parsed.y || 0);
                                                    }
                                                }
                                            }
                                        },
                                        scales: {
                                            y: {
                                                ...axis(undefined, {
                                                    callback: function(value: string | number) {
                                                        return `₱${value}`;
                                                    }
                                                }),
                                                beginAtZero: true,
                                            },
                                            x: axis()
                                        }
                                    }}
                                    data={{
                                        labels: categoryBreakdown.map(item => item.category),
                                        datasets: [
                                            {
                                                label: 'Sales',
                                                data: categoryBreakdown.map(item => item.sales),
                                                backgroundColor: 'rgba(16, 185, 129, 0.6)',
                                                borderColor: 'rgba(16, 185, 129, 1)',
                                                borderWidth: 1,
                                            }
                                        ]
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">No category data available</div>
                        )}
                    </div>

                    <div className="bg-card p-5 rounded-xl shadow-md border border-border">
                        <h2 className="text-base font-semibold mb-3 text-foreground">Items Sold by Category</h2>
                        {categoryBreakdown.length > 0 ? (
                            <div style={{ height: '300px' }}>
                                <Bar 
                                    options={{
                                        ...chartBase,
                                        indexAxis: 'y' as const,
                                        scales: {
                                            x: {
                                                ...axis(undefined, { precision: 0 }),
                                                beginAtZero: true,
                                            },
                                            y: axis()
                                        }
                                    }}
                                    data={{
                                        labels: categoryBreakdown.map(item => item.category),
                                        datasets: [
                                            {
                                                label: 'Items Sold',
                                                data: categoryBreakdown.map(item => item.quantity),
                                                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                                                borderColor: 'rgba(59, 130, 246, 1)',
                                                borderWidth: 1,
                                            }
                                        ]
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">No category data available</div>
                        )}
                    </div>
                </div>

                {/* Cup counts by product */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    <div className="bg-card p-5 rounded-xl shadow-md border border-border">
                        <h2 className="text-base font-semibold mb-3 text-foreground">Cups Per Product</h2>
                        {sortedProducts.map((item, index) => (
                            <ProductCupCount 
                                key={item.product}
                                product={item.product} 
                                count={item.count}
                                totalCups={totalCups}
                                index={index}
                                unitLabel="cups"
                            />
                        ))}
                    </div>
                    
                    <div className="bg-card p-5 rounded-xl shadow-md border border-border">
                        <h2 className="text-base font-semibold mb-3 text-foreground">Food & Pastry Items</h2>
                        {sortedFoodProducts.length > 0 ? (
                            sortedFoodProducts.map((item, index) => (
                                <ProductCupCount 
                                    key={item.product}
                                    product={item.product} 
                                    count={item.count}
                                    totalCups={totalFoodItems || 1}
                                    index={index}
                                    unitLabel="items"
                                />
                            ))
                        ) : (
                            <div className="text-center py-6 text-muted-foreground">No food or pastry sales in this range</div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
