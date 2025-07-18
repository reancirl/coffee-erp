import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';

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
    categoryCounts: Record<string, number>;
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
        <div className="text-3xl font-bold">{value}</div>
    </div>
);

// Category cup count component
const CategoryCupCount = ({ 
    category, 
    count, 
    totalCups 
}: { 
    category: string; 
    count: number; 
    totalCups: number 
}) => {
    const percentage = totalCups > 0 ? Math.round((count / totalCups) * 100) : 0;
    const colorClass = categoryColors[category] || 'bg-gray-500';
    
    return (
        <div className="mb-4">
            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{category}</span>
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
    const { rangeSales, totalCups, categoryCounts, startDate, endDate } = salesData;
    
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
    
    // Sort categories by cup count (descending)
    const sortedCategories = Object.entries(categoryCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .map(([category]) => category);
    
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
                    <StatCard 
                        title="Average Per Cup" 
                        value={totalCups > 0 ? formatCurrency(rangeSales / totalCups) : formatCurrency(0)}
                        icon="📊"
                        color="bg-indigo-600"
                    />
                </div>
                
                {/* Cup counts by category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                        <h2 className="text-lg font-semibold mb-4">Cup Count by Category</h2>
                        {sortedCategories.map(category => (
                            <CategoryCupCount 
                                key={category}
                                category={category} 
                                count={categoryCounts[category]}
                                totalCups={totalCups}
                            />
                        ))}
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                        <h2 className="text-lg font-semibold mb-4">Best Selling Categories</h2>
                        <div className="space-y-4">
                            {sortedCategories.slice(0, 5).map((category, index) => (
                                <div key={category} className="flex items-center">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white mr-3 font-bold" style={{ backgroundColor: Object.values(categoryColors)[index % 5] }}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium">{category}</h3>
                                        <div className="text-sm text-gray-500">{categoryCounts[category]} cups</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
