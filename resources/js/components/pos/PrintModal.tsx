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
            // When Skip Printing is selected, close the modal and reset the order
            setSelectedPrintOptions(['Skip Printing']);
            // Brief delay to show selection before closing
            setTimeout(() => {
                onDone();
            }, 300);
        } else {
            // When Order Slip is selected, print immediately
            setSelectedPrintOptions(['Order Slip']);
            // Brief delay to show selection before printing
            setTimeout(() => {
                printOrderSlip();
                // Allow time for print dialog to appear before closing modal
                setTimeout(() => {
                    onDone();
                }, 800);
            }, 300);
        }
    };
    
    // Print order slip with a new browser window approach
    const printOrderSlip = () => {
        if (isPrinting) return;
        setIsPrinting(true);
      
        console.log('Printing order:', { order, orderType, beeperNumber, orderNumber, totalAmount });
      
        try {
          const printWindow = window.open('', '_blank', 'width=800,height=600');
          printWindowRef.current = printWindow;
      
          if (!printWindow) {
            alert('Please allow popups for this site to print receipts.');
            setIsPrinting(false);
            return;
          }
      
          const orderSlipContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>EASTLONE cafe Order Slip</title>
              <style>
                @page {
                  margin: 0;
                  size: 80mm auto;
                }
                body {
                  font-family: Arial, sans-serif;
                  font-size: 14px;
                  line-height: 1.2;
                  -webkit-font-smoothing: antialiased;
                  -moz-osx-font-smoothing: grayscale;
                  width: 70mm;
                  margin: 0 auto;
                  padding: 3mm 0;
                }
                .header {
                  text-align: center;
                  margin-bottom: 8px;
                }
                .title {
                  font-size: 16px;        /* smaller */
                  font-weight: bold;
                }
                .divider {
                  border-top: 1px dashed #000;
                  margin: 6px 0;
                }
                .section-title {
                  font-weight: bold;
                  margin: 8px 0 4px;
                  font-size: 17px;
                }
                .section-beeper-number {
                  font-weight: bold;
                  margin: 8px 0 4px;
                  font-size: 19px;
                }
                .row, .product-row, .total-row {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 4px;     /* ↑ slight spacing */
                }
                .product-name {
                  flex-grow: 1;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  max-width: 70%;
                }
                .amount {
                  width: 60px;
                  text-align: right;
                }
                .total-row {
                  font-size: 17px;        /* ↑ bumped from 15px */
                  font-weight: bold;
                  margin-top: 8px;        /* ↑ more breathing room */
                }
                .footer {
                  text-align: center;
                  margin-top: 12px;       /* ↑ more breathing room */
                  font-size: 14px;        /* ↑ bumped from 11px */
                  line-height: 1.3;
                }
              </style>
              <script>
                window.onload = () => {
                  setTimeout(() => {
                    window.print();
                    setTimeout(() => window.close(), 500);
                  }, 300);
                };
              </script>
            </head>
            <body>
              <div class="header">
                ${beeperNumber ? `<div class="section-beeper-number">#${beeperNumber}</div>` : ''}
                <div class="title">EASTLONE cafe</div>
                <div>ORDER SLIP</div>
              </div>
      
              <div class="divider"></div>
              
              <div class="section-title">ORDER INFO</div>
              <div class="row">
                <span>Date:</span>
                <span>${new Date().toLocaleString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}</span>
              </div>
              <div class="row">
                <span>Type:</span>
                <span>${orderType ? orderType.toUpperCase() : 'UNKNOWN'}</span>
              </div>
      
              <div class="divider"></div>
      
              <div class="section-title">ORDER ITEMS</div>
              ${(order||[]).map((item:any) => {
                const fmt = (p:any) => {
                  const n = Number(p);
                  return isNaN(n) ? '0.00' : n.toFixed(2);
                };
                
                // Get the variant (hot/iced) to display next to the item name
                let variant = '';
                if (item.selectedVariant) {
                  variant = item.selectedVariant === 'hot' || item.selectedVariant === 'iced' ? 
                    item.selectedVariant.toUpperCase() : item.selectedVariant;
                } else if (item.selectedCustomizations && item.selectedCustomizations['Variant']) {
                  variant = item.selectedCustomizations['Variant'].toUpperCase();
                }
                
                // Format the item name with variant
                let displayName;
                if (item.name.toLowerCase() === 'cookies' && variant) {
                  // For cookies, format as "Cookies - MATCHA" for better visual separation
                  displayName = `${item.name} - ${variant}`;
                } else {
                  // For other products, keep the current format "Coffee HOT"
                  displayName = variant ? `${variant} - ${item.name}` : item.name;
                }
                
                let details = '';
                // Show other customizations except variant (which is now with the name)
                if (item.selectedCustomizations) {
                  Object.entries(item.selectedCustomizations).forEach(([k,v]) => {
                    if (k !== 'Variant') { // Skip variant as it's already shown with name
                      details += `<div class="row" style="padding-left:10px;"><span>- ${k}:</span><span>${v}</span></div>`;
                    }
                  });
                }
                
                // Display add-ons with their variants too
                if (item.addOns?.length) {
                  item.addOns.forEach((a:any) => {
                    // Get add-on variant if available
                    let addOnVariant = '';
                    if (a.selectedVariant) {
                      addOnVariant = a.selectedVariant === 'hot' || a.selectedVariant === 'iced' ? 
                        a.selectedVariant.toUpperCase() : a.selectedVariant;
                    } else if (a.selectedCustomizations && a.selectedCustomizations['Variant']) {
                      addOnVariant = a.selectedCustomizations['Variant'].toUpperCase();
                    }
                    
                    // Format add-on name with variant
                    const addOnName = addOnVariant ? `${a.name} ${addOnVariant}` : a.name;
                    const type = a.type === 'alt-milk' ? 'ALT MILK' : 'ADD-ON';
                    details += `<div class="row" style="padding-left:10px;"><span>- ${type}: ${addOnName}</span><span>+₱${fmt(a.price)}</span></div>`;
                  });
                }
                
                return `
                <div class="product-row">
                  <span class="product-name">${displayName}</span>
                  <span class="amount">₱${fmt(item.price)}</span>
                </div>
                ${details}
                `;
              }).join('')}
      
              <div class="divider"></div>
      
              <div class="section-title">PAYMENT</div>
              <div class="total-row">
                <span>Total Amount:</span>
                <span>₱${(!isNaN(totalAmount)&&totalAmount>0?totalAmount:0).toFixed(2)}</span>
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
      
          printWindow.document.write(orderSlipContent);
          printWindow.document.close();
      
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
                    
                    {/* Buttons removed - actions now happen automatically when an option is selected */}
                    <p className="mt-4 text-sm text-center italic">
                        Click an option to continue
                    </p>
                </div>
            </div>
        </>
    );
};

export default PrintModal;