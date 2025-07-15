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
                    <title>Coffee Shop Order Slip</title>
                    <style>
                        body {
                            width: 80mm;
                            font-family: 'Courier New', monospace;
                            font-size: 12px;
                            line-height: 1.2;
                            margin: 0;
                            padding: 5mm;
                        }
                        .header {
                            text-align: center;
                            font-weight: bold;
                            margin-bottom: 5mm;
                        }
                        .line {
                            margin: 2mm 0;
                        }
                        .separator {
                            border-bottom: 1px dashed #000;
                            margin: 3mm 0;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 5mm;
                            font-weight: bold;
                        }
                        .bold {
                            font-weight: bold;
                        }
                        @media print {
                            body {
                                width: 80mm;
                                margin: 0;
                            }
                        }
                    </style>
                    <script>
                        // Auto print and close when loaded
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
                        <div>ORDER SLIP</div>
                        <div>ORDER #${orderNumber !== 'N/A' ? orderNumber : 'Pending'}</div>
                    </div>
                    
                    <div class="line">Date: ${new Date().toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    })}</div>
                    <div class="line">Type: ${(orderType || 'Unknown').toUpperCase()}</div>
                    ${beeperNumber ? `<div class="line">Beeper #: ${beeperNumber}</div>` : ''}
                    
                    <div class="separator"></div>
                    
                    ${(order || []).map((item: any, index: number) => {
                        const formatPrice = (price: any) => {
                            const num = Number(price);
                            return isNaN(num) ? '0.00' : num.toFixed(2);
                        };
                        
                        // Format item details
                        let details = '';
                        if (item.selectedVariant) {
                            details += `   Variant: ${item.selectedVariant}<br/>`;
                        }
                        
                        if (item.selectedCustomizations && Object.keys(item.selectedCustomizations).length > 0) {
                            Object.entries(item.selectedCustomizations).forEach(([key, value]) => {
                                if (key !== 'Variant') { 
                                    details += `   ${key}: ${value}<br/>`;
                                }
                            });
                        }
                        
                        if (item.addOns && item.addOns.length > 0) {
                            details += '   Add-ons:<br/>';
                            item.addOns.forEach((addon: any) => {
                                details += `      ${addon.name} (${formatPrice(addon.price)})<br/>`;
                                if (addon.selectedVariant) {
                                    details += `         Variant: ${addon.selectedVariant}<br/>`;
                                }
                            });
                        }
                        
                        return `
                            <div>
                                <div class="line">
                                    ${item.name} - ₱${formatPrice(item.price)}
                                </div>
                                <div style="font-size: 10px">
                                    ${details}
                                </div>
                                ${index < (order || []).length - 1 ? '<div style="margin-bottom: 2mm;"></div>' : ''}
                            </div>
                        `;
                    }).join('')}
                    
                    <div class="separator"></div>
                    
                    <div class="line bold">
                        Total Amount: ₱${(!isNaN(totalAmount) && totalAmount > 0 ? totalAmount : 0).toFixed(2)}
                    </div>
                    
                    <div class="footer">
                        <div>KITCHEN COPY</div>
                        <div>Thank you!</div>
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