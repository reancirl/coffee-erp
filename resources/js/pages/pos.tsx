import { Head, router, usePage } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import ProductCategory from '../components/pos/ProductCategory';
import OrderSummary from '../components/pos/OrderSummary';
import CustomizationModal from '../components/pos/CustomizationModal';
import DiscountModal from '../components/pos/DiscountModal';
import PaymentModal from '../components/pos/PaymentModal';
import CustomerModal from '../components/pos/CustomerModal';
import AddOnModal from '../components/pos/AddOnModal';
import { paymentMethods } from '../components/pos/data';
import { Product, MenuData, primaryColor } from '../components/pos/types';

interface PageProps {
    flash: {
        success?: string;
        order_number?: string;
        message?: string;
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
    const [qrCodeImage, setQrCodeImage] = useState<File | null>(null);
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
    const [discountType, setDiscountType] = useState<string>('Senior Citizen');
    const [discountSelections, setDiscountSelections] = useState<{ [orderItemId: number]: boolean }>({});
    const [customers] = useState<Customer[]>(dummyCustomers);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    // State variables for order type and beeper number
    const [orderType, setOrderType] = useState<string>("dine-in");
    const [beeperNumber, setBeeperNumber] = useState<string>("");

    
    // API data state
    const [menuData, setMenuData] = useState<MenuData>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // Notification state
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    
    // Order processing state - to prevent double submissions
    const [isProcessingOrder, setIsProcessingOrder] = useState(false);
    
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

    const handlePayment = () => {
        const total = Number(calculateFinalTotal());
        if (!selectedPaymentMethod) {
            alert('Please select a payment method.');
            return;
        }
        if (selectedPaymentMethod.id === 'Cash') {
            const given = Number(cashAmountGiven);
            if (isNaN(given) || given < total) {
                alert('Please enter an amount that covers the final total.');
                return;
            }
        } else if (selectedPaymentMethod.id === 'GCash' || selectedPaymentMethod.id === 'Debit Card') {
            if (!receiptImage) {
                alert('Please take a picture of the transaction receipt.');
                return;
            }
        } else if (selectedPaymentMethod.id === 'PMNA Card') {
            if (!qrCodeImage) {
                alert('Please scan the QR Code using your camera.');
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
      
        form.append('discount', '0')
        form.append('notes', `Customer: ${selectedCustomer?.name || 'Guest'}`)
      
        // Attach any images
        if (receiptImage) form.append('receipt_image', receiptImage)
        if (qrCodeImage)   form.append('qr_code_image', qrCodeImage)
      
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
            
            // Automatically print receipt
            const receiptWindow = window.open('', '_blank');
            if (receiptWindow) {
              // Format receipt content
              const orderDate = new Date().toLocaleString();
              const orderItems = order.map(item => {
                const itemPrice = Number(item.price).toFixed(2);
                
                // Get variant information - check all possible properties where variant info might be stored
                let variantInfo = '';
                if (item.selectedVariant) {
                  // Direct variant property
                  variantInfo = item.selectedVariant === 'hot' || item.selectedVariant === 'iced' ? 
                    ` (${item.selectedVariant.charAt(0).toUpperCase() + item.selectedVariant.slice(1)})` : 
                    ` (${item.selectedVariant})`;
                } else if (item.selectedCustomizations && item.selectedCustomizations['Variant']) {
                  // Variant stored in customizations
                  variantInfo = ` (${item.selectedCustomizations['Variant']})`;
                }
                
                // Format item name with variant
                let itemDetails = `${item.name}${variantInfo} - ₱${itemPrice}`;
                
                // Add other customizations if any
                if (item.selectedCustomizations) {
                  Object.entries(item.selectedCustomizations).forEach(([key, value]) => {
                    // Skip 'Variant' as it's already included
                    if (key !== 'Variant') {
                      itemDetails += `\n  * ${key}: ${value}`;
                    }
                  });
                }
                
                // Add add-ons if any
                if (item.addOns && item.addOns.length > 0) {
                  item.addOns.forEach(addOn => {
                    let addOnVariant = '';
                    if (addOn.selectedVariant) {
                      addOnVariant = ` (${addOn.selectedVariant})`;
                    } else if (addOn.selectedCustomizations && addOn.selectedCustomizations['Variant']) {
                      addOnVariant = ` (${addOn.selectedCustomizations['Variant']})`;
                    }
                    
                    itemDetails += `\n  + ${addOn.name}${addOnVariant} - ₱${Number(addOn.price).toFixed(2)}`;
                    
                    // Add add-on customizations if any
                    if (addOn.selectedCustomizations) {
                      Object.entries(addOn.selectedCustomizations).forEach(([key, value]) => {
                        if (key !== 'Variant') {
                          itemDetails += `\n    * ${key}: ${value}`;
                        }
                      });
                    }
                  });
                }
                
                return itemDetails;
              }).join('\n');
              
              const total = calculateFinalTotal();
              
              // Create receipt HTML
              receiptWindow.document.write(`
                <html>
                <head>
                  <title>Receipt</title>
                  <style>
                    body { font-family: monospace; width: 300px; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 10px; }
                    .items { margin: 15px 0; }
                    .total { font-weight: bold; margin-top: 10px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; }
                  </style>
                </head>
                <body onload="window.print(); setTimeout(() => window.close(), 500);">
                  <div class="header">
                    <h2>Coffee ERP</h2>
                    <p>Order #${flash?.order_number || 'N/A'}</p>
                    <p>${orderDate}</p>
                    <p>Order Type: ${orderType}</p>
                    ${beeperNumber ? `<p>Beeper: ${beeperNumber}</p>` : ''}
                    <p>Customer: ${selectedCustomer?.name || 'Guest'}</p>
                  </div>
                  <div class="items">
                    <p>${orderItems}</p>
                  </div>
                  <div class="total">
                    <p>Total: ₱${total}</p>
                    <p>Payment: ${selectedPaymentMethod?.name || 'Unknown'}</p>
                  </div>
                  <div class="footer">
                    <p>Thank you for your order!</p>
                  </div>
                </body>
                </html>
              `);
            }
            
            // Reset the order and other state
            setOrder([]);
            setSelectedPaymentMethod(null);
            setCashAmountGiven('');
            setReceiptImage(null);
            setQrCodeImage(null);
            setSelectedCustomer(null);
            
            // Reset the order processing flag after a delay to prevent immediate resubmission
            setTimeout(() => {
              setIsProcessingOrder(false);
            }, 5000); // 5-second lock to prevent double orders
          },
          onError: (errors) => {
            console.error('Error creating order:', errors)
            setNotificationMessage('Failed to create order. Please try again.');
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
            
            // Reset the order processing flag to allow retry
            setIsProcessingOrder(false);
          },
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
            const canAddDirectly = 
                !product.customizations || 
                product.customizations.length === 0 || 
                (product.customizations.every(c => c.options.length === 1));
            
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
                setSelectedProduct(product);
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
                    isAddOn: true
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
                id: Date.now(),
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
        // setQrCodeImage(null);
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
        } else if (method.id.toLowerCase() === 'pmna' && !qrCodeImage) {
            alert('Please scan the QR code for this payment.');
            return;
        }
        
        setSelectedPaymentMethod(method);
        setIsPaymentModalOpen(false);
        setIsCustomerModalOpen(true);
    };

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
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                        </div>
                    ) : (
                        <>
                            {/* Coffee Section */}
                            {menuData["Coffee"] && (
                                <ProductCategory
                                    title="Coffee"
                                    products={menuData["Coffee"].map((item, index) => ({
                                        id: index + 1, // Assign sequential IDs starting from 1
                                        ...item,
                                        price: item.prices?.hot || item.prices?.iced || 0,
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
                            products={menuData["Blended Drinks"].map((item, index) => ({
                                id: 100 + index, // Using 100s range to avoid conflicts
                                ...item,
                                price: item.price || 0
                            }))}
                            onProductClick={handleProductClick}
                        />
                    )}

                    {/* River Fizz */}
                    {menuData["River Fizz"] && (
                        <ProductCategory
                            title="River Fizz"
                            products={menuData["River Fizz"].map((item, index) => ({
                                id: 200 + index, // Using 200s range to avoid conflicts
                                ...item,
                                price: item.price || 0
                            }))}
                            onProductClick={handleProductClick}
                        />
                    )}

                    {/* Black Trails */}
                    {menuData["Black Trails"] && (
                        <ProductCategory
                            title="Black Trails"
                            products={menuData["Black Trails"].map((item, index) => ({
                                id: 300 + index, // Using 300s range to avoid conflicts
                                ...item,
                                price: item.price || 0
                            }))}
                            onProductClick={handleProductClick}
                        />
                    )}

                    {/* Greens & Grains */}
                    {menuData["Greens & Grains"] && (
                        <ProductCategory
                            title="Greens & Grains"
                            products={menuData["Greens & Grains"].map((item, index) => ({
                                id: 400 + index, // Using 400s range to avoid conflicts
                                ...item,
                                price: item.prices?.hot || item.prices?.iced || item.price || 0,
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
                            products={menuData["Add-Ons"].map((item, index) => ({
                                id: 500 + index, // Using 500s range to avoid conflicts
                                ...item,
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
                            products={menuData["Alternative Milk"].map((item, index) => ({
                                id: 1000 + index, // Assign unique ID (using different range to avoid conflicts)
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
                            products={menuData["Beverage"].map((item, index) => ({
                                id: 1500 + index, // Using 1500s range to avoid conflicts
                                ...item,
                                price: item.price || 0
                            }))}
                            onProductClick={handleProductClick}
                        />
                    )}

                    {/* Food */}
                    {menuData["Food"] && (
                        <ProductCategory
                            title="Food"
                            products={menuData["Food"].map((item, index) => ({
                                id: 1600 + index, // Using 1600s range to avoid conflicts
                                ...item,
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
                    onAddToOrder={(customizations: any) => addToOrder(selectedProduct, customizations)}
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
                qrCodeImage={qrCodeImage}
                setQrCodeImage={setQrCodeImage}
            />

            <CustomerModal
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                onComplete={handleCustomerComplete}
                customers={customers}
                selectedCustomer={selectedCustomer}
                setSelectedCustomer={setSelectedCustomer}
            />

            {/* PrintModal removed - automatic printing implemented */}
        </div>
    );
}