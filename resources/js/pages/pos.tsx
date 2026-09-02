import { Head, router, usePage } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import ProductCategory from '../components/pos/ProductCategory';
import OrderSummary from '../components/pos/OrderSummary';
import CustomizationModal from '../components/pos/CustomizationModal';
import DiscountModal from '../components/pos/DiscountModal';
import PaymentModal from '../components/pos/PaymentModal';
import EmployeeQrScanner, { type ScannedEmployee } from '../components/pos/EmployeeQrScanner';
import CustomerModal from '../components/pos/CustomerModal';
import PrintModal, { type ReceiptPayment } from '../components/pos/PrintModal';
import AddOnModal from '../components/pos/AddOnModal';
import { paymentMethods } from '../components/pos/data';
import { Product, MenuData, primaryColor } from '../components/pos/types';

interface PageProps {
    flash: {
        success?: string;
        order_number?: string;
        message?: string;
        // Read back from the ledger after the sale, so the slip prints the
        // real remaining balance rather than the terminal's stale copy.
        allowance_remaining?: number | null;
    };
    [key: string]: any; // Allow other page props
}

interface Customer {
    id: number;
    name: string;
}

// Dummy customer data
const dummyCustomers: Customer[] = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Mike Johnson' },
    { id: 4, name: 'Sarah Williams' },
];

export default function Pos() {
    const { flash } = usePage<PageProps>().props;
    const [order, setOrder] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedAddOn, setSelectedAddOn] = useState<{ product: Product; } | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<{ id: string; name: string } | null>(null);
    const [cashAmountGiven, setCashAmountGiven] = useState<string>("");
    const [receiptImage, setReceiptImage] = useState<File | null>(null);
    // Employee allowance: identity confirmed by the server, not by the camera.
    const [scannedEmployee, setScannedEmployee] = useState<ScannedEmployee | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
    const [discountType, setDiscountType] = useState<string>('Senior Citizen');
    const [discountSelections, setDiscountSelections] = useState<{ [orderItemId: number]: boolean }>({});
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [selectedPrintOptions, setSelectedPrintOptions] = useState<string[]>([]);
    const [customers] = useState<Customer[]>(dummyCustomers);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    // State variables for order type and beeper number
    const [orderType, setOrderType] = useState<string>("dine-in");
    const [beeperNumber, setBeeperNumber] = useState<string>("");
    // Save the current order for printing after submission
    const [savedOrderForPrinting, setSavedOrderForPrinting] = useState<Product[]>([]);
    // Same idea for the payment: captured at submit time, because the terminal
    // is reset for the next customer as soon as the slip is dismissed.
    const [savedPaymentForPrinting, setSavedPaymentForPrinting] = useState<ReceiptPayment | null>(null);

    
    // API data state
    const [menuData, setMenuData] = useState<MenuData>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // Notification state
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    
    // Order processing state - to prevent double submissions
    const [isProcessingOrder, setIsProcessingOrder] = useState(false);
    
    // Split payment state
    const [splitCashAmount, setSplitCashAmount] = useState<string>('');
    const [splitGcashAmount, setSplitGcashAmount] = useState<string>('');
    // The allowance half of an Allowance + Cash split.
    const [splitAllowanceAmount, setSplitAllowanceAmount] = useState<string>('');
    
    // Helper function to check if product is an add-on
    const isAddOn = (product: any): boolean => {
        // Primary check: use the explicit type property
        if (product.type !== undefined) {
            return product.type === 'addon';
        }
        
        // Fallback: name-based detection for backward compatibility
        const knownAddOns = ['Oat Milk', 'Espresso', 'Extra Shot', 'Vanilla Syrup', 'Caramel Syrup'];
        return knownAddOns.includes(product.name);
    };
    
    // Helper function to check if product is an alternative milk
    const isAlternativeMilk = (product: any): boolean => {
        if (!isAddOn(product)) return false;
        return product.name.toLowerCase().includes('milk');
    };
    
    // Fetch products from the API
    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/pos/products');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                setMenuData(data.menuData);
                setError(null);
            } catch (err) {
                setError('Failed to load products. Please refresh the page.');
                console.error('Error fetching products:', err);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchProducts();
    }, []);
    
    // Handle flash messages
    React.useEffect(() => {
        if (flash?.message) {
            setNotificationMessage(flash.message);
            setShowNotification(true);
            
            // Auto-hide after 5 seconds
            const timer = setTimeout(() => {
                setShowNotification(false);
            }, 5000);
            
            return () => clearTimeout(timer);
        }
    }, [flash]);

    // Which products the allowance cannot pay for. Read off the menu rather
    // than off the cart, so it holds however an item got added.
    const ineligibleForAllowance = new Set<number>();
    Object.values(menuData).forEach((products) =>
        products.forEach((product) => {
            if (product.allowance_eligible === false) {
                ineligibleForAllowance.add(product.id);
            }
        })
    );

    const ineligibleNames = Array.from(
        new Set(
            order
                .flatMap((item) => [item, ...(item.addOns ?? [])])
                .filter((item) => ineligibleForAllowance.has(item.id))
                .map((item) => item.name)
        )
    );

    // Same wording the order endpoint uses when it refuses, so the cashier
    // does not see two different explanations for one rule.
    const usesAllowance = (methodId?: string) =>
        methodId === 'employee-allowance' || methodId === 'allowance-cash';

    // Why this Allowance + Cash split cannot go through, or null if it can.
    const allowanceSplitProblem = (total: number): string | null => {
        const fromAllowance = Number(splitAllowanceAmount);
        const fromCash = Number(splitCashAmount);

        if (!splitAllowanceAmount || !splitCashAmount) {
            return 'Enter how much comes from the allowance and how much is cash.';
        }
        if (fromAllowance <= 0 || fromCash <= 0) {
            return 'Both parts must be more than zero. Use a single payment method instead.';
        }
        const remaining = scannedEmployee?.allowance?.remaining ?? 0;
        if (fromAllowance > remaining + 0.01) {
            return `Only \u20b1${remaining.toFixed(2)} is left on this allowance.`;
        }
        if (Math.abs(fromAllowance + fromCash - total) > 0.01) {
            return `The allowance and cash amounts must add up to \u20b1${total.toFixed(2)}.`;
        }
        return null;
    };

    const allowanceBlockedReason = (): string | null =>
        ineligibleNames.length === 0
            ? null
            : `The coffee allowance does not cover ${ineligibleNames.join(', ')}. ` +
              `Remove ${ineligibleNames.length === 1 ? 'it' : 'them'} or pay another way.`;

    const handlePayment = () => {
        const total = Number(calculateFinalTotal());
        if (!selectedPaymentMethod) {
            alert('Please select a payment method.');
            return;
        }
        if (selectedPaymentMethod.id === 'cash') {
            const given = Number(cashAmountGiven);
            if (isNaN(given) || given < total) {
                alert('Please enter an amount that covers the final total.');
                return;
            }
        } else if (selectedPaymentMethod.id === 'g-cash' || selectedPaymentMethod.id === 'debit') {
            if (!receiptImage) {
                alert('Please take a picture of the transaction receipt.');
                return;
            }
        } else if (usesAllowance(selectedPaymentMethod.id)) {
            if (!scannedEmployee) {
                alert('Scan the employee QR before confirming this payment.');
                return;
            }
            const blocked = allowanceBlockedReason();
            if (blocked) {
                alert(blocked);
                return;
            }
            if (selectedPaymentMethod.id === 'allowance-cash') {
                const problem = allowanceSplitProblem(total);
                if (problem) {
                    alert(problem);
                    return;
                }
            }
        } else if (selectedPaymentMethod.id === 'split') {
            const cashAmount = Number(splitCashAmount);
            const gcashAmount = Number(splitGcashAmount);
            const splitTotal = cashAmount + gcashAmount;
            
            if (!splitCashAmount || !splitGcashAmount) {
                alert('Please enter both cash and GCash amounts for split payment.');
                return;
            }
            if (Math.abs(splitTotal - total) > 0.01) { // Allow for small floating point differences
                alert(`Split payment amounts must equal the total amount of ₱${total.toFixed(2)}`);
                return;
            }
            if (cashAmount <= 0 || gcashAmount <= 0) {
                alert('Both cash and GCash amounts must be greater than zero.');
                return;
            }
        }

        setIsPaymentModalOpen(false);
        setIsCustomerModalOpen(true);
    };

    const handleCustomerComplete = (orderTypeValue: string, beeperNumberValue: string) => {
        // Prevent double order submission
        if (isProcessingOrder) {
            setNotificationMessage('Order is already being processed. Please wait...');
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
            return;
        }
        
        // Set order processing flag
        setIsProcessingOrder(true);
        
        // Set order type and beeper number
        setOrderType(orderTypeValue);
        setBeeperNumber(beeperNumberValue);
        
        // Build multipart form data
        const form = new FormData()
        form.append('payment_method', selectedPaymentMethod!.name)
        form.append('order_type', orderTypeValue) // Add order type to form
        form.append('beeper_number', beeperNumberValue) // Add beeper number to form
        order.forEach((item, i) => {
          // Convert id to string to ensure it's properly formatted
          const productId = String(item.id);
          form.append(`items[${i}][product_id]`, productId)
          form.append(`items[${i}][product_name]`, item.name)
          form.append(`items[${i}][quantity]`, '1')
          form.append(`items[${i}][price]`, item.price.toString())
          
          // Add item-level discount if this item has discount applied
          const itemDiscount = discountSelections[item.id] ? (item.price * 0.2) : 0;
          form.append(`items[${i}][discount]`, itemDiscount.toString())
          
          if (item.selectedVariant) {
            form.append(`items[${i}][variant]`, item.selectedVariant)
          }
          if (item.selectedCustomizations) {
            Object.entries(item.selectedCustomizations).forEach(
              ([key, val]) =>
                form.append(`items[${i}][customizations][${key}]`, val)
            )
          }
          // nested add-ons
          item.addOns?.forEach((addOn, j) => {
            const addOnId = String(addOn.id);
            form.append(`items[${i}][add_ons][${j}][product_id]`, addOnId)
            form.append(`items[${i}][add_ons][${j}][product_name]`, addOn.name)
            form.append(`items[${i}][add_ons][${j}][price]`, addOn.price.toString())
            if (addOn.selectedVariant) {
              form.append(`items[${i}][add_ons][${j}][variant]`, addOn.selectedVariant)
            }
            if (addOn.selectedCustomizations) {
              Object.entries(addOn.selectedCustomizations).forEach(
                ([k, v]) =>
                  form.append(
                    `items[${i}][add_ons][${j}][customizations][${k}]`,
                    v
                  )
              )
            }
            form.append(`items[${i}][add_ons][${j}][quantity]`, '1')
          })
        })
      
        // Calculate total order-level discount from all discounted items
        const totalOrderDiscount = order.reduce(
          (acc, item) => (discountSelections[item.id] ? acc + (item.price * 0.2) : acc),
          0
        );
        form.append('discount', totalOrderDiscount.toString())
        form.append('notes', `Customer: ${selectedCustomer?.name || 'Guest'}`)
      
        // Attach any images
        if (receiptImage) form.append('receipt_image', receiptImage)
        
        // The server re-validates this token before accepting the payment.
        if (usesAllowance(selectedPaymentMethod?.id) && scannedEmployee) {
            form.append('employee_qr_token', scannedEmployee.token)
        }

        // Add split payment data if applicable
        if (selectedPaymentMethod?.id === 'split') {
            form.append('split_cash_amount', splitCashAmount)
            form.append('split_gcash_amount', splitGcashAmount)
        }

        if (selectedPaymentMethod?.id === 'allowance-cash') {
            form.append('split_allowance_amount', splitAllowanceAmount)
            form.append('split_cash_amount', splitCashAmount)
        }
      
        // Save current order for printing
        setSavedOrderForPrinting([...order]);

        // ...and how it was paid. The employee block is attached only for an
        // allowance sale, so a scan that was abandoned for another method
        // cannot leak someone's balance onto an unrelated slip.
        const printedTotal = Number(calculateFinalTotal());
        const isCash = selectedPaymentMethod!.id === 'cash';
        const cashGiven = Number(cashAmountGiven);
        const hasCashGiven = isCash && cashAmountGiven !== '' && !isNaN(cashGiven);
        const isAllowance = usesAllowance(selectedPaymentMethod!.id);
        const isAllowanceSplit = selectedPaymentMethod!.id === 'allowance-cash';
        const drawnFromAllowance = isAllowanceSplit ? Number(splitAllowanceAmount) : printedTotal;

        setSavedPaymentForPrinting({
            method: selectedPaymentMethod!.name,
            methodId: selectedPaymentMethod!.id,
            total: printedTotal,
            cashGiven: hasCashGiven ? cashGiven : null,
            change: hasCashGiven ? cashGiven - printedTotal : null,
            splitCash:
                selectedPaymentMethod!.id === 'split' || isAllowanceSplit
                    ? Number(splitCashAmount)
                    : null,
            splitGcash: selectedPaymentMethod!.id === 'split' ? Number(splitGcashAmount) : null,
            splitAllowance: isAllowanceSplit ? Number(splitAllowanceAmount) : null,
            employee:
                isAllowance && scannedEmployee
                    ? {
                          name: scannedEmployee.name,
                          code: scannedEmployee.employee_code,
                          // Fallback only; the server's figure replaces this
                          // once the order comes back.
                          remaining: scannedEmployee.allowance
                              ? scannedEmployee.allowance.remaining - drawnFromAllowance
                              : null,
                      }
                    : null,
        });
        
        // Send as multipart
        router.post('/orders', form, {
          forceFormData: true,
          onSuccess: () => {
            // Close the customer modal
            setIsCustomerModalOpen(false);
            
            // Show success message
            setNotificationMessage(`Order completed for ${selectedCustomer?.name || 'Guest'}!`);
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
            
            // Open print modal for order slip printing
            setIsPrintModalOpen(true);
            
            // Reset processing flag after a delay to prevent double submissions
            setTimeout(() => {
              setIsProcessingOrder(false); // Allow new orders after 5 seconds
            }, 5000);
          },
          onError: (errors: any) => {
            console.error('Error creating order:', errors)
            setNotificationMessage('Failed to create order. Please try again.');
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
            
            // Reset the order processing flag to allow retry
            setIsProcessingOrder(false);
          }
        })
      }

    const handleProductClick = (product: Product) => {
        // Check if the product is an add-on
        if (isAddOn(product)) {
            // For add-ons, show the selection modal to choose which item to add to
            if (order.length === 0) {
                // No items to add this add-on to
                setNotificationMessage("Please add a product first before selecting add-ons");
                setShowNotification(true);
                setTimeout(() => setShowNotification(false), 3000);
                return;
            }
            
            // Show the modal to let user choose which item to add the add-on to
            setSelectedAddOn({ product });
        } else {
            // For regular products
            // Check if this product can be added directly (no customizations or only one option per customization)
            // Special check for cookies to ensure variant selection is always shown
            const isCookie = product.name.toLowerCase() === 'cookies';
            
            const canAddDirectly = 
                (!isCookie && !product.customizations) || 
                (!isCookie && product.customizations?.length === 0) || 
                (!isCookie && product.customizations && product.customizations.every(c => c.options.length === 1));
            
            if (canAddDirectly) {
                // Add directly to order without showing modal
                const customizations: { [key: string]: string } = {};
                let variant: 'hot' | 'iced' | undefined = undefined;
                
                // Auto-select customization options if there's only one option per customization
                if (product.customizations) {
                    product.customizations.forEach((c, index) => {
                        if (c.options.length === 1) {
                            customizations[c.name] = c.options[0];
                        }
                    });
                }
                
                // If it has prices with hot/iced, select the first available one
                if (product.prices) {
                    variant = product.prices.hot !== null ? 'hot' : 'iced';
                    
                    // Ensure the Variant customization is set to match the selected variant
                    if (variant === 'hot') {
                        customizations['Variant'] = 'Hot';
                    } else if (variant === 'iced') {
                        customizations['Variant'] = 'Iced';
                    }
                }
                
                addToOrder(product, customizations, variant);
                
                // Show brief notification
                setNotificationMessage(`Added ${product.name} to order`);
                setShowNotification(true);
                setTimeout(() => setShowNotification(false), 2000);
            } else {
                // Show customization modal for complex customizations
                // Check if this is the Cookies product and ensure it has customizations
                if (product.name.toLowerCase() === 'cookies' && (!product.customizations || product.customizations.length === 0)) {
                    // Add cookie variants if they're missing
                    const cookieWithVariants = {
                        ...product,
                        customizations: [
                            {
                                name: 'Variant',
                                options: ['Matcha', 'Chocolate', 'Peanut Butter', 'Red Velvet'],
                                required: true
                            }
                        ]
                    };
                    
                    // Debug
                    
                    setSelectedProduct(cookieWithVariants);
                } else {
                    // Debug
                    setSelectedProduct(product);
                }
            }
        }
    };

    const addToOrder = (product: Product, customizations?: { [key: string]: string }, variant?: 'hot' | 'iced', targetItemId?: number) => {
        let finalPrice = product.price;
        if (product.prices && variant) {
            finalPrice = product.prices[variant] || product.price;
        }
        
        const newOrder = [...order];
        
        if (targetItemId !== undefined) {
            // Add as add-on to existing item
            const targetIndex = newOrder.findIndex(item => item.id === targetItemId);
            if (targetIndex !== -1) {
                const targetItem = newOrder[targetIndex];
                const addOn = {
                    ...product,
                    price: finalPrice,
                    selectedCustomizations: customizations,
                    selectedVariant: variant,
                    isAddOn: true,
                    id: product.id,
                };
                
                if (!targetItem.addOns) {
                    targetItem.addOns = [];
                }
                targetItem.addOns.push(addOn);
                
                // Update the order with the modified item
                newOrder[targetIndex] = { ...targetItem };
                setOrder(newOrder);
            }
        } else {
            // Add as new item
            const customizedProduct = { 
                ...product, 
                id: product.id,
                price: finalPrice,
                selectedCustomizations: customizations,
                selectedVariant: variant,
                addOns: []
            };
            newOrder.push(customizedProduct);
            setOrder(newOrder);
        }
        
        setSelectedProduct(null);
        setSelectedAddOn(null);
    };

    const removeFromOrder = (product: Product) => {
        setOrder((prevOrder) => {
            const index = prevOrder.findIndex((item) => item.id === product.id);
            if (index !== -1) {
                const updatedOrder = [...prevOrder];
                updatedOrder.splice(index, 1);
                return updatedOrder;
            }
            return prevOrder;
        });
    };

    const handleProceedToPayment = () => {
        // Check if an order is already being processed
        if (isProcessingOrder) {
            setNotificationMessage('An order is currently being processed. Please wait...');
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
            return;
        }
        
        if (order.length === 0) {
            setNotificationMessage('No items in the order. Please add items before proceeding to payment.');
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
            return;
        }
        setIsPaymentModalOpen(true);
    };
    
    // Reset all form fields and state values after transaction completion
    const resetForm = () => {
        // Just force a full page refresh for a completely clean state
        // This is the most reliable way to reset everything
        window.location.reload();
        
        // If we didn't reload, we would need to reset all these states:
        // setIsPrintModalOpen(false);
        // setIsPaymentModalOpen(false);
        // setIsCustomerModalOpen(false);
        // setIsDiscountModalOpen(false);
        // setOrder([]);
        // setSelectedProduct(null);
        // setSelectedAddOn(null);
        // setSelectedPaymentMethod(null);
        // setCashAmountGiven('');
        // setReceiptImage(null);
        // setSelectedCustomer(null);
        // setSelectedPrintOptions([]);
        // setOrderType('dine-in');
        // setBeeperNumber('');
    };

    // Safe conversion to numeric value
    const safeNumber = (value: any): number => {
        if (value === undefined || value === null) return 0;
        const num = Number(value);
        return isNaN(num) ? 0 : num;
    };

    // This duplicate resetForm function has been removed to fix the error

    const calculateFinalTotal = () => {
    // Calculate subtotal
    const subtotal = order.reduce((sum, item) => {
        // Add item price (safely convert to number)
        let itemTotal = safeNumber(item.price);
        
        // Add any add-ons (safely convert to number)
        if (item.addOns && Array.isArray(item.addOns)) {
            itemTotal += item.addOns.reduce((addOnSum, addOn) => {
                return addOnSum + safeNumber(addOn.price);
            }, 0);
        }
        
        return sum + itemTotal;
    }, 0);
    
    // Calculate discount for items that have discount applied
    const discount = order.reduce(
        (acc, item) => (discountSelections[item.id] ? acc + safeNumber(item.price) * 0.2 : acc),
        0
    );
    
    // Return final total (subtotal - discount)
    return (subtotal - discount).toFixed(2);
};

    const handleConfirmPayment = (method: { id: string; name: string; }) => {
        // Validate payment based on method
        const amount = parseFloat(calculateFinalTotal());
        
        if (method.id.toLowerCase() === 'cash') {
            const given = parseFloat(cashAmountGiven);
            if (isNaN(given) || given < amount) {
                alert('Please enter an amount that covers the total.');
                return;
            }
        } else if (method.id.toLowerCase() === 'debit' && !receiptImage) {
            alert('Please upload a receipt for this payment.');
            return;
        } else if (usesAllowance(method.id)) {
            if (!scannedEmployee) {
                alert('Scan the employee QR before continuing.');
                return;
            }
            const blocked = allowanceBlockedReason();
            if (blocked) {
                alert(blocked);
                return;
            }
            if (method.id === 'allowance-cash') {
                const problem = allowanceSplitProblem(amount);
                if (problem) {
                    alert(problem);
                    return;
                }
            }
        }
        
        setSelectedPaymentMethod(method);
        setIsPaymentModalOpen(false);
        setIsCustomerModalOpen(true);
    };

    // The balance the server read back after the sale wins over the estimate
    // taken at submit time; a concurrent redemption or adjustment would have
    // moved it.
    const receiptPayment: ReceiptPayment | null =
        savedPaymentForPrinting && savedPaymentForPrinting.employee && typeof flash?.allowance_remaining === 'number'
            ? {
                  ...savedPaymentForPrinting,
                  employee: {
                      ...savedPaymentForPrinting.employee,
                      remaining: flash.allowance_remaining,
                  },
              }
            : savedPaymentForPrinting;

    return (
        <div
            className="h-screen w-screen p-4"
            style={{ backgroundColor: primaryColor }}
        >
            <Head title="POS" />
            
            {/* Notification */}
            {showNotification && (
                <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-md shadow-lg z-50">
                    {notificationMessage}
                </div>
            )}
            
            {/* Error Message */}
            {error && (
                <div className="fixed top-4 left-4 bg-red-500 text-white p-4 rounded-md shadow-lg z-50">
                    {error}
                </div>
            )}
            <div className="flex flex-col lg:flex-row h-full">
                {/* Product List Section */}
                <div
                    className="lg:w-2/3 w-full p-4 border-b lg:border-b-0 lg:border-r overflow-y-auto"
                    style={{ backgroundColor: primaryColor }}
                >
                    {/* Loading State */}
                    {isLoading ? (
                        <div className="flex justify-center items-center h-32 my-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
                        </div>
                    ) : (
                        <>
                            {/* Coffee Section */}
                            {menuData["Coffee"] && (
                                <ProductCategory
                                    title="Coffee"
                                    products={menuData["Coffee"].map((item) => ({
                                        ...item,
                                        price: item.prices?.hot ?? item.prices?.iced ?? item.price ?? 0,
                                        id: item.id, // Assign sequential IDs starting from 1
                                        customizations: item.prices ? [
                                            { name: 'Variant', options: [
                                                ...(item.prices.hot !== null ? ['Hot'] : []),
                                                ...(item.prices.iced !== null ? ['Iced'] : [])
                                            ], required: true }
                                        ] : []
                                    }))}
                                    onProductClick={handleProductClick}
                                />
                            )}
                        </>
                    )}

                    {/* Blended Drinks */}
                    {menuData["Blended Drinks"] && (
                        <ProductCategory
                            title="Blended Drinks"
                            products={menuData["Blended Drinks"].map((item) => ({
                                ...item,
                                price: item.price || 0,
                                id: item.id, // Using 100s range to avoid conflicts
                            }))}
                            onProductClick={handleProductClick}
                        />
                    )}

                    {/* River Fizz */}
                    {menuData["River Fizz"] && (
                        <ProductCategory
                            title="River Fizz"
                            products={menuData["River Fizz"].map((item) => ({
                                ...item,
                                id: item.id, // Using 200s range to avoid conflicts
                                price: item.price || 0
                            }))}
                            onProductClick={handleProductClick}
                        />
                    )}

                    {/* Black Trails */}
                    {menuData["Black Trails"] && (
                        <ProductCategory
                            title="Black Trails"
                            products={menuData["Black Trails"].map((item) => ({
                                ...item,
                                id: item.id, // Using 300s range to avoid conflicts
                                price: item.price || 0
                            }))}
                            onProductClick={handleProductClick}
                        />
                    )}

                    {/* Greens & Grains */}
                            {menuData["Greens & Grains"] && (
                                <ProductCategory
                                    title="Greens & Grains"
                                    products={menuData["Greens & Grains"].map((item) => ({
                                        ...item,
                                        id: item.id, // Using 400s range to avoid conflicts
                                        price: item.prices?.hot ?? item.prices?.iced ?? item.price ?? 0,
                                        customizations: item.prices ? [
                                            { name: 'Variant', options: [
                                                ...(item.prices.hot !== null ? ['Hot'] : []),
                                                ...(item.prices.iced !== null ? ['Iced'] : [])
                                            ], required: true }
                                ] : []
                            }))}
                            onProductClick={handleProductClick}
                        />
                    )}

                    {/* Add-Ons */}
                    {menuData["Add-Ons"] && (
                        <ProductCategory
                            title="Add-Ons"
                            products={menuData["Add-Ons"].map((item) => ({
                                ...item,
                                id: item.id, // Using 500s range to avoid conflicts
                                price: item.price || 0,
                                type: 'addon' // Marking explicitly as an add-on for amber/orange border with ADD-ON badge
                            }))}
                            onProductClick={handleProductClick}
                        />
                    )}

                    {/* Alternative Milk */}
                    {menuData["Alternative Milk"] && (
                        <ProductCategory
                            title="Alternative Milk"
                            products={menuData["Alternative Milk"].map((item) => ({
                                id: item.id, // Assign unique ID (using different range to avoid conflicts)
                                name: item.name,
                                price: item.price || 0,
                                type: 'addon',  // Mark as add-on
                                is_alternative_milk: true  // For teal border and ALT MILK badge
                            }))}
                            onProductClick={handleProductClick}
                        />
                    )}

                    {/* Beverage */}
                    {menuData["Beverage"] && (
                        <ProductCategory
                            title="Beverage"
                            products={menuData["Beverage"].map((item) => ({
                                ...item,
                                id: item.id, // Using 1500s range to avoid conflicts
                                price: item.price || 0
                            }))}
                            onProductClick={handleProductClick}
                        />
                    )}

                    {/* Food */}
                    {menuData["Food"] && (
                        <ProductCategory
                            title="Food"
                            products={menuData["Food"].map((item) => ({
                                ...item,
                                id: item.id, // Using 1600s range to avoid conflicts
                                price: item.price || 0,
                                // If item has customizations (like cookie variants), preserve them
                                customizations: item.customizations || []
                            }))}
                            onProductClick={handleProductClick}
                        />
                    )}
                </div>

                {/* Order Summary Section */}
                <OrderSummary
                    order={order}
                    onRemoveItem={removeFromOrder}
                    onApplyDiscount={() => setIsDiscountModalOpen(true)}
                    onProceedToPayment={handleProceedToPayment}
                    discountSelections={discountSelections}
                    discountType={discountType}
                    ineligibleForAllowance={ineligibleForAllowance}
                />
            </div>

            {/* Add On Modal */}
            {selectedAddOn && (
                <AddOnModal
                    isOpen={true}
                    onClose={() => setSelectedAddOn(null)}
                    orderItems={order.filter(item => !isAddOn(item)) as (Product & { id: number })[]}  
                    addOn={selectedAddOn.product}
                    onSelectItem={(itemId) => {
                        if (selectedAddOn) {
                            addToOrder(
                                selectedAddOn.product, 
                                undefined, 
                                undefined, 
                                itemId
                            );
                        }
                    }}
                />
            )}

            {/* Modals */}
            {selectedProduct && (
                <CustomizationModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    onAddToOrder={(customizations: any, variant?: 'hot' | 'iced') => 
                        addToOrder(selectedProduct, customizations, variant)
                    }
                />
            )}

            <DiscountModal
                isOpen={isDiscountModalOpen}
                onClose={() => setIsDiscountModalOpen(false)}
                order={order}
                discountType={discountType}
                setDiscountType={setDiscountType}
                discountSelections={discountSelections}
                setDiscountSelections={setDiscountSelections}
            />

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onPaymentMethodSelect={(method: {id: string, name: string}) => setSelectedPaymentMethod(method)}
                selectedPaymentMethod={selectedPaymentMethod}
                onConfirmPayment={handleConfirmPayment}
                paymentMethods={paymentMethods}
                amount={parseFloat(calculateFinalTotal())}
                cashAmountGiven={cashAmountGiven}
                setCashAmountGiven={setCashAmountGiven}
                receiptImage={receiptImage}
                setReceiptImage={setReceiptImage}
                onScanEmployee={() => setIsScannerOpen(true)}
                scannedEmployee={scannedEmployee}
                clearScannedEmployee={() => setScannedEmployee(null)}
                splitCashAmount={splitCashAmount}
                setSplitCashAmount={setSplitCashAmount}
                splitGcashAmount={splitGcashAmount}
                setSplitGcashAmount={setSplitGcashAmount}
                splitAllowanceAmount={splitAllowanceAmount}
                setSplitAllowanceAmount={setSplitAllowanceAmount}
            />

            <EmployeeQrScanner
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onIdentified={(employee) => {
                    setScannedEmployee(employee);
                    setIsScannerOpen(false);
                }}
            />

            <CustomerModal
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                onComplete={handleCustomerComplete}
                customers={customers}
                selectedCustomer={selectedCustomer}
                setSelectedCustomer={setSelectedCustomer}
            />

            <PrintModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                selectedPrintOptions={selectedPrintOptions}
                setSelectedPrintOptions={setSelectedPrintOptions}
                onDone={() => {
                    setIsPrintModalOpen(false);
                    setOrder([]);
                    setSelectedPaymentMethod(null);
                    setCashAmountGiven('');
                    setReceiptImage(null);
                    setScannedEmployee(null);
                    setSelectedCustomer(null);
                    setSavedPaymentForPrinting(null);
                    setSplitCashAmount('');
                    setSplitGcashAmount('');
                    setSplitAllowanceAmount('');
                    setBeeperNumber(''); // Clear beeper number when transaction is done
                }}
                orderType={orderType}
                beeperNumber={beeperNumber}
                order={savedOrderForPrinting}
                orderNumber={flash?.order_number || ''}
                totalAmount={Number(calculateFinalTotal())}
                payment={receiptPayment}
            />
        </div>
    );
}
