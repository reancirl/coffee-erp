import React from 'react';

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
    allProductsSold: ProductSales[];
}

interface ZReportPrinterProps {
    reportData: ZReportData;
    onPrintStart?: () => void;
    onPrintComplete?: () => void;
}

// Helper function to format currency
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2
    }).format(amount);
};

const ZReportPrinter: React.FC<ZReportPrinterProps> = ({ reportData, onPrintStart, onPrintComplete }) => {
    const printZReport = () => {
        if (!reportData) return;
        
        // Notify print start if callback provided
        if (onPrintStart) onPrintStart();
        
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            alert('Please allow popups for this site to print the Z-Report.');
            if (onPrintComplete) onPrintComplete();
            return;
        }
        
        // Format the date for display
        const formattedDate = new Date(reportData.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Get current timestamp for the report generation
        const timestamp = new Date().toLocaleString();
        
        // Build HTML content for the Z-report receipt
        const zReportContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Z-Report - ${formattedDate}</title>
                <style>
                    @page {
                        margin: 0;
                        size: 80mm auto; /* Typical thermal receipt width and auto height */
                    }
                    body {
                        font-family: 'Courier New', monospace;
                        width: 72mm; /* Slightly less than paper width for safety */
                        margin: 0 auto;
                        padding: 2mm 0;
                        font-size: 12px;
                        line-height: 1.2;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 10px;
                    }
                    .title {
                        font-size: 14px;
                        font-weight: bold;
                    }
                    .divider {
                        border-top: 1px dashed black;
                        margin: 5px 0;
                    }
                    .section-title {
                        font-weight: bold;
                        margin: 10px 0 5px 0;
                    }
                    .row {
                        display: flex;
                        justify-content: space-between;
                    }
                    .product-row {
                        display: flex;
                        justify-content: space-between;
                    }
                    .product-name {
                        flex-grow: 1;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        overflow: hidden;
                        max-width: 70%;
                    }
                    .quantity {
                        width: 30px;
                        text-align: right;
                        margin-right: 5px;
                    }
                    .amount {
                        width: 60px;
                        text-align: right;
                    }
                    .total-row {
                        font-weight: bold;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 10px;
                        font-size: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">EASTLONE cafe</div>
                    <div>Z-REPORT</div>
                    <div>${formattedDate}</div>
                </div>
                
                <div class="divider"></div>
                
                <div class="section-title">SUMMARY</div>
                <div class="row">
                    <span>Total Orders:</span>
                    <span>${reportData.totalOrders}</span>
                </div>
                <div class="row">
                    <span>Gross Sales:</span>
                    <span>${formatCurrency(reportData.grossSales)}</span>
                </div>
                <div class="row">
                    <span>Discounts:</span>
                    <span>${formatCurrency(reportData.discounts)}</span>
                </div>
                <div class="row total-row">
                    <span>Net Sales:</span>
                    <span>${formatCurrency(reportData.netSales)}</span>
                </div>
                
                <div class="divider"></div>
                
                <div class="section-title">SALES BY PAYMENT METHOD</div>
                ${Object.entries(reportData.paymentMethodTotals).map(([method, data]) => `
                    <div class="row">
                        <span>${method} (${data.count}):</span>
                        <span>${formatCurrency(data.total)}</span>
                    </div>
                `).join('')}
                
                <div class="divider"></div>
                
                <div class="section-title">PRODUCTS SOLD</div>
                ${reportData.allProductsSold.map(product => `
                    <div class="product-row">
                        <span class="product-name">${product.product_name}</span>
                        <span class="quantity">${product.quantity_sold}</span>
                        <span class="amount">${formatCurrency(product.total_sales)}</span>
                    </div>
                `).join('')}
                
                <div class="divider"></div>
                
                <div class="footer">
                    <div>Report generated: ${timestamp}</div>
                    <div>--- End of Z-Report ---</div>
                </div>
            </body>
            </html>
        `;
        
        // Write the content to the window
        printWindow.document.write(zReportContent);
        printWindow.document.close();
        
        // Wait for content to load then print
        printWindow.onload = () => {
            // Add slight delay to ensure styles are loaded
            setTimeout(() => {
                printWindow.print();
                
                // Handle print completion
                printWindow.onafterprint = () => {
                    printWindow.close();
                    if (onPrintComplete) onPrintComplete();
                };
            }, 500);
        };
    };
    
    return (
        <button
            onClick={printZReport}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
            Print Z-Report
        </button>
    );
};

export default ZReportPrinter;
