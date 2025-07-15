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
                  font-size: 16px;        /* ↑ bumped from 14px */
                  line-height: 1.4;       /* ↑ slight increase */
                  -webkit-font-smoothing: antialiased;
                  -moz-osx-font-smoothing: grayscale;
                  width: 72mm;
                  margin: 0 auto;
                  padding: 4mm 0;
                }
                .header {
                  text-align: center;
                  margin-bottom: 8px;
                }
                .title {
                  font-size: 18px;        /* ↑ bumped from 16px */
                  font-weight: bold;
                }
                .divider {
                  border-top: 1px dashed #000;
                  margin: 6px 0;
                }
                .section-title {
                  font-weight: bold;
                  margin: 8px 0 4px;
                  font-size: 17px;        /* ↑ bumped from 15px */
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
                <span>${(orderType||'Unknown').toUpperCase()}</span>
              </div>
              ${beeperNumber ? `<div class="row"><span>Beeper #:</span><span>${beeperNumber}</span></div>` : ''}
      
              <div class="divider"></div>
      
              <div class="section-title">ORDER ITEMS</div>
              ${(order||[]).map((item:any) => {
                const fmt = (p:any) => {
                  const n = Number(p);
                  return isNaN(n) ? '0.00' : n.toFixed(2);
                };
                let details = '';
                if (item.selectedVariant) {
                  details += `<div class="row" style="padding-left:10px;"><span>- Variant:</span><span>${item.selectedVariant}</span></div>`;
                }
                if (item.selectedCustomizations) {
                  Object.entries(item.selectedCustomizations).forEach(([k,v]) => {
                    if (k !== 'Variant') {
                      details += `<div class="row" style="padding-left:10px;"><span>- ${k}:</span><span>${v}</span></div>`;
                    }
                  });
                }
                if (item.addOns?.length) {
                  item.addOns.forEach((a:any) => {
                    const type = a.type === 'alt-milk' ? 'ALT MILK' : 'ADD-ON';
                    details += `<div class="row" style="padding-left:10px;"><span>- ${type}: ${a.name}</span><span>+₱${fmt(a.price)}</span></div>`;
                  });
                }
                return `
                  <div class="product-row">
                    <span class="product-name">${item.name}</span>
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