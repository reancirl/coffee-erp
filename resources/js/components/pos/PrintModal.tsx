import React, { useState, useRef, useEffect } from 'react';
import { primaryColor, secondaryColor, accentColor } from './types';
import OrderSlip from './OrderSlip';

interface PrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedPrintOptions: string[];
    setSelectedPrintOptions: (options: string[]) => void;
    onDone: () => void;
    orderType: string; // Added order type (dine-in or takeout)
    beeperNumber: string; // Added beeper number
    order: any[]; // Order items
    orderNumber: string; // Order number
    totalAmount: number; // Total amount of the order
}

const PrintModal: React.FC<PrintModalProps> = ({
    isOpen,
    selectedPrintOptions,
    setSelectedPrintOptions,
    onDone,
    orderType,
    beeperNumber,
    order,
    orderNumber,
    totalAmount,
}) => {
    if (!isOpen) return null;
    
    // State for print window
    const [isPrinting, setIsPrinting] = useState(false);
    const printWindowRef = useRef<Window | null>(null);
    
    // Effect to handle print window management
    useEffect(() => {
        // Cleanup function to close print window if component unmounts
        return () => {
            if (printWindowRef.current && !printWindowRef.current.closed) {
                printWindowRef.current.close();
            }
        };
    }, []);

    const togglePrintOption = (option: string) => {
        if (option === 'Skip Printing') {
            if (selectedPrintOptions.includes('Skip Printing')) {
                setSelectedPrintOptions([]);
            } else {
                setSelectedPrintOptions(['Skip Printing']);
            }
        } else {
            if (selectedPrintOptions.includes('Skip Printing')) {
                setSelectedPrintOptions([]);
            }
            if (selectedPrintOptions.includes(option)) {
                setSelectedPrintOptions(selectedPrintOptions.filter((o) => o !== option));
            } else {
                setSelectedPrintOptions([...selectedPrintOptions, option]);
            }
        }
    };
    
    // Print order slip with a new browser window approach
    const printOrderSlip = () => {
        // Prevent multiple print windows
        if (isPrinting) return;
        
        setIsPrinting(true);
        
        // Debug the order data
        console.log('Printing order:', { order, orderType, beeperNumber, orderNumber, totalAmount });
        
        try {
            // Create a new window for printing
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            printWindowRef.current = printWindow;
            
            if (!printWindow) {
                alert('Please allow popups for this site to print receipts.');
                setIsPrinting(false);
                return;
            }
            
            // Generate OrderSlip HTML content
            const orderSlipContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>EASTLONE cafe Order Slip</title>
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
                    .line {
                        margin: 2mm 0;
                    }
                    .separator {
                        border-bottom: 1px dashed #000;
                        margin: 3mm 0;
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
                        margin-bottom: 3px;
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
                        margin-top: 5px;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 10px;
                        font-size: 10px;
                    }
                    .bold {
                        font-weight: bold;
                    }
                    </style>
                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                                setTimeout(function() {
                                    window.close();
                                }, 500);
                            }, 300);
                        };
                    </script>
                </head>
                <body>
                    <div class="header">
                        <div class="title">EASTLONE cafe</div>
                        <div>ORDER SLIP</div>
                        <div>ORDER #${orderNumber !== 'N/A' ? orderNumber : 'Pending'}</div>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <div class="section-title">ORDER INFO</div>
                    <div class="row">
                        <span>Date:</span>
                        <span>${new Date().toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</span>
                    </div>
                    <div class="row">
                        <span>Type:</span>
                        <span>${(orderType || 'Unknown').toUpperCase()}</span>
                    </div>
                    ${beeperNumber ? `<div class="row"><span>Beeper #:</span><span>${beeperNumber}</span></div>` : ''}
                    
                    <div class="divider"></div>
                    
                    <div class="section-title">ORDER ITEMS</div>
                    ${(order || []).map((item: any, index: number) => {
                        const formatPrice = (price: any) => {
                            const num = Number(price);
                            return isNaN(num) ? '0.00' : num.toFixed(2);
                        };
                        
                        // Generate item row HTML
                        const itemRow = `
                            <div class="product-row">
                                <span class="product-name">${item.quantity}x ${item.name}</span>
                                <span class="amount">₱${formatPrice(item.total || (item.price * item.quantity))}</span>
                            </div>
                        `;
                        
                        // Format item details
                        let details = '';
                        
                        // Add variant information
                        if (item.selectedVariant) {
                            details += `<div class="row" style="padding-left: 10px;"><span>- Variant:</span><span>${item.selectedVariant}</span></div>`;
                        }
                        
                        // Add customizations
                        if (item.selectedCustomizations && Object.keys(item.selectedCustomizations).length > 0) {
                            Object.entries(item.selectedCustomizations).forEach(([key, value]) => {
                                if (key !== 'Variant') { 
                                    details += `<div class="row" style="padding-left: 10px;"><span>- ${key}:</span><span>${value}</span></div>`;
                                }
                            });
                        }
                        
                        // Add add-ons, with proper labeling for regular add-ons and alt milk
                        if (item.addOns && item.addOns.length > 0) {
                            item.addOns.forEach((addon: any) => {
                                const addonType = addon.type === 'alt-milk' ? 'ALT MILK' : 'ADD-ON';
                                details += `<div class="row" style="padding-left: 10px;"><span>- ${addonType}: ${addon.name}</span><span>+₱${formatPrice(addon.price)}</span></div>`;
                            });
                        }
                        
                        return `
                            ${itemRow}
                            ${details}
                        `;
                    }).join('')}
                    
                    <div class="divider"></div>
                    
                    <div class="section-title">PAYMENT</div>
                    <div class="row total-row">
                        <span>Total Amount:</span>
                        <span>₱${(!isNaN(totalAmount) && totalAmount > 0 ? totalAmount : 0).toFixed(2)}</span>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <div class="footer">
                        <div>BARISTA COPY</div>
                        <div>Thank you for your purchase!</div>
                        <div>${new Date().toLocaleString()}</div>
                    </div>
                </body>
                </html>
            `;
            
            // Write the content to the new window
            printWindow.document.write(orderSlipContent);
            printWindow.document.close();
            
            // Handle window close
            printWindow.onbeforeunload = () => {
                setIsPrinting(false);
                printWindowRef.current = null;
            };
            
        } catch (error) {
            console.error('Printing error:', error);
            setIsPrinting(false);
        }
    };

    return (
        <>
            
            {/* Print modal UI */}
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div
                    className="bg-white p-6 rounded shadow-lg w-96"
                    style={{ backgroundColor: primaryColor, color: accentColor }}
                >
                    <h2 className="text-xl font-semibold mb-4">Print Options</h2>
                    

                    
                    <div className="grid grid-cols-1 gap-4">
                        {['Order Slip', 'Skip Printing'].map((option) => {
                            const isSelected = selectedPrintOptions.includes(option);
                            return (
                                <div
                                    key={option}
                                    onClick={() => togglePrintOption(option)}
                                    className={`p-4 border rounded cursor-pointer text-center ${
                                        isSelected
                                            ? 'bg-blue-500 text-white border-blue-500'
                                            : 'bg-gray-200 text-black'
                                    }`}
                                >
                                    {option}
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="flex justify-between mt-4">
                        {selectedPrintOptions.includes('Order Slip') && (
                            <button
                                className="px-4 py-2 rounded text-sm font-semibold bg-green-500 text-white hover:bg-green-600"
                                onClick={printOrderSlip}
                            >
                                Print Order Slip
                            </button>
                        )}
                        <button
                            className="px-4 py-2 rounded text-sm font-semibold ml-auto"
                            style={{
                                backgroundColor: secondaryColor,
                                color: accentColor,
                                border: `1px solid ${accentColor}`,
                            }}
                            onClick={() => {
                                // If Order Slip is selected but not yet printed, print it now
                                if (selectedPrintOptions.includes('Order Slip')) {
                                    printOrderSlip();
                                    // Wait a bit for printing to start before completing
                                    setTimeout(() => {
                                        onDone();
                                    }, 500);
                                } else {
                                    onDone();
                                }
                            }}
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PrintModal;