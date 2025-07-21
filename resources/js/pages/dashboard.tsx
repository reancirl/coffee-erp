import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
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
    'Black Trails': 'bg-gray-800',
    'Greens & Grains': 'bg-green-600'
};

// Card component for stats
const StatCard = ({ title, value, icon, color }: { title: string; value: string; icon?: string; color?: string }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col">
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-gray-500 text-sm uppercase font-medium">{title}</h3>
            {icon && (
                <div className={`${color || 'bg-blue-500'} p-2 rounded-full text-white`}>
                    <span className="text-xl">{icon}</span>
                </div>
            )}
        </div>
        <div className="text-3xl font-bold text-black">{value}</div>
    </div>
);

// Product cup count component
const ProductCupCount = ({ 
    product, 
    count, 
    totalCups,
    index
}: { 
    product: string; 
    count: number; 
    totalCups: number;
    index: number;
}) => {
    const percentage = totalCups > 0 ? Math.round((count / totalCups) * 100) : 0;
    // Rotate through colors
    const colors = Object.values(categoryColors);
    const colorClass = colors[index % colors.length];
    
    return (
        <div className="mb-4">
            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{product}</span>
                <span className="text-sm text-gray-600">{count} cups ({percentage}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                    className={`${colorClass} h-2.5 rounded-full`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

export default function Dashboard({ salesData }: DashboardProps) {
    const { rangeSales, totalCups, totalCupsThisWeek, productCounts, dailyCups, startDate, endDate } = salesData;
    
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
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 bg-gray-50">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <h1 className="text-2xl font-bold">Sales Overview: {dateRangeText}</h1>
                    
                    {/* Date Filter Form */}
                    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <label htmlFor="start_date" className="text-sm font-medium text-gray-700">From:</label>
                            <input 
                                type="date" 
                                id="start_date"
                                value={data.start_date}
                                onChange={e => setData('start_date', e.target.value)}
                                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <label htmlFor="end_date" className="text-sm font-medium text-gray-700">To:</label>
                            <input 
                                type="date" 
                                id="end_date"
                                value={data.end_date}
                                onChange={e => setData('end_date', e.target.value)}
                                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={processing}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75"
                        >
                            Filter
                        </button>
                    </form>
                </div>
                
                {/* Today's sales stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    {/* <StatCard 
                        title="Total Cups This Week" 
                        value={`${totalCupsThisWeek}`}
                        icon="📈"
                        color="bg-indigo-600"
                    /> */}
                </div>
                
                {/* Daily Cups Graph */}
                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                        <h2 className="text-lg font-semibold mb-4">Daily Cups Served</h2>
                        {dailyCups.length > 0 ? (
                            <div style={{ height: '300px' }}>
                                <Line
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'top' as const,
                                            },
                                            tooltip: {
                                                callbacks: {
                                                    label: function(context) {
                                                        return `${context.parsed.y} cups`;
                                                    }
                                                }
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                title: {
                                                    display: true,
                                                    text: 'Cups Served'
                                                },
                                                ticks: {
                                                    precision: 0
                                                }
                                            },
                                            x: {
                                                title: {
                                                    display: true,
                                                    text: 'Date'
                                                }
                                            }
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
                            <div className="text-center py-10 text-gray-500">No data available for the selected date range</div>
                        )}
                    </div>
                </div>
                
                {/* Cup counts by product */}
                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                        <h2 className="text-lg font-semibold mb-4">Cups Per Product</h2>
                        {sortedProducts.map((item, index) => (
                            <ProductCupCount 
                                key={item.product}
                                product={item.product} 
                                count={item.count}
                                totalCups={totalCups}
                                index={index}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
