import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import ZReportPrinter from '@/components/reports/ZReportPrinter';

// Define types for the Z-Report data
interface ProductSales {
    product_name: string;
    quantity_sold: number;
    total_sales: number;
}

interface HourlySales {
    count: number;
    total: number;
}

interface PaymentMethodTotal {
    count: number;
    total: number;
}

interface ZReportData {
    date: string;
    totalOrders: number;
    grossSales: number;
    discounts: number;
    netSales: number;
    paymentMethodTotals: Record<string, PaymentMethodTotal>;
    topProducts: ProductSales[];
    salesByHour: Record<string, HourlySales>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Reports',
        href: '/reports',
    },
    {
        title: 'Z-Report',
        href: '/reports/z-report',
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

export default function ZReport({ reportData }: { reportData?: ZReportData }) {
    const [date, setDate] = useState<string>(() => {
        // Default to today
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    
    const [isPrinting, setIsPrinting] = useState(false);
    
    // Handle date change
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDate(e.target.value);
    };
    
    // Generate Z-report for selected date
    const generateReport = () => {
        router.get(route('reports.z-report.generate'), {
            date: date
        }, {
            preserveState: true,
        });
    };
    
    // Handle printing start and complete events 
    const handlePrintStart = () => {
        setIsPrinting(true);
    };
    
    const handlePrintComplete = () => {
        setIsPrinting(false);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Z-Report" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Z-Report</h2>
                </div>

                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 text-gray-900">
                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
                                Select Date for Z-Report:
                            </label>
                            <div className="flex items-center">
                                <input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={handleDateChange}
                                    className="shadow appearance-none border rounded py-2 px-3 mr-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                                <button
                                    onClick={generateReport}
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Generate Report
                                </button>
                            </div>
                        </div>
                        
                        {reportData && (
                            <div className="mt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-semibold">
                                        Z-Report for {new Date(reportData.date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </h3>
                                    <div className="print-button">
                                        {isPrinting ? (
                                            <span className="bg-gray-400 text-white font-bold py-2 px-4 rounded opacity-50 cursor-not-allowed">
                                                Printing...
                                            </span>
                                        ) : (
                                            <ZReportPrinter 
                                                reportData={reportData} 
                                                onPrintStart={handlePrintStart}
                                                onPrintComplete={handlePrintComplete}
                                            />
                                        )}
                                    </div>
                                </div>
                                
                                {/* Summary */}
                                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                                    <h4 className="font-semibold mb-2">Summary</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Total Orders</p>
                                            <p className="font-bold text-lg">{reportData.totalOrders}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Gross Sales</p>
                                            <p className="font-bold text-lg">{formatCurrency(reportData.grossSales)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Discounts</p>
                                            <p className="font-bold text-lg text-red-600">-{formatCurrency(reportData.discounts)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Net Sales</p>
                                            <p className="font-bold text-lg text-green-600">{formatCurrency(reportData.netSales)}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Payment Methods */}
                                    <div className="p-4 border rounded-lg">
                                        <h4 className="font-semibold mb-2">Sales by Payment Method</h4>
                                        <table className="min-w-full">
                                            <thead>
                                                <tr>
                                                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                                                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                                                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(reportData.paymentMethodTotals).map(([method, data], index) => (
                                                    <tr key={index} className="border-b">
                                                        <td className="py-2">{method}</td>
                                                        <td className="py-2">{data.count}</td>
                                                        <td className="py-2 text-right">{formatCurrency(data.total)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* Top Products */}
                                    <div className="p-4 border rounded-lg">
                                        <h4 className="font-semibold mb-2">Top Selling Products</h4>
                                        <table className="min-w-full">
                                            <thead>
                                                <tr>
                                                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.topProducts.map((product, index) => (
                                                    <tr key={index} className="border-b">
                                                        <td className="py-2">{product.product_name}</td>
                                                        <td className="py-2 text-right">{product.quantity_sold}</td>
                                                        <td className="py-2 text-right">{formatCurrency(product.total_sales)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                
                                {/* Hourly Sales */}
                                <div className="mt-6 p-4 border rounded-lg">
                                    <h4 className="font-semibold mb-2">Hourly Sales</h4>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead>
                                                <tr>
                                                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hour</th>
                                                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                                                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(reportData.salesByHour)
                                                    .sort((a, b) => {
                                                        // Sort by hour
                                                        const hourA = parseInt(a[0].split(':')[0]);
                                                        const hourB = parseInt(b[0].split(':')[0]);
                                                        return hourA - hourB;
                                                    })
                                                    .map(([hour, data], index) => (
                                                    <tr key={index} className="border-b">
                                                        <td className="py-2">{hour}</td>
                                                        <td className="py-2 text-right">{data.count}</td>
                                                        <td className="py-2 text-right">{formatCurrency(data.total)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {!reportData && (
                            <div className="text-center p-10 text-gray-500">
                                Select a date and click "Generate Report" to view the Z-Report for that day.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
