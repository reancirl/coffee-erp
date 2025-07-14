import { Head, router, usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import ProductCategory from '../components/pos/ProductCategory';
import OrderSummary from '../components/pos/OrderSummary';
import CustomizationModal from '../components/pos/CustomizationModal';
import DiscountModal from '../components/pos/DiscountModal';
import PaymentModal from '../components/pos/PaymentModal';
import CustomerModal from '../components/pos/CustomerModal';
import PrintModal from '../components/pos/PrintModal';
import AddOnModal from '../components/pos/AddOnModal';
import { paymentMethods, menuData, isAddOn } from '../components/pos/data';
import { Product, primaryColor } from '../components/pos/types';

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
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<{id: string, name: string} | null>(null);
    const [cashAmountGiven, setCashAmountGiven] = useState('');
    const [receiptImage, setReceiptImage] = useState<File | null>(null);
    const [qrCodeImage, setQrCodeImage] = useState<File | null>(null);
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
    const [discountType, setDiscountType] = useState<string>('Senior Citizen');
    const [discountSelections, setDiscountSelections] = useState<{ [orderItemId: number]: boolean }>({});
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [selectedPrintOptions, setSelectedPrintOptions] = useState<string[]>([]);
    const [customers] = useState<Customer[]>(dummyCustomers);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    
    // Notification state
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    
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

    const handleCustomerComplete = () => {
        // Build multipart form data
        const form = new FormData()
        form.append('payment_method', selectedPaymentMethod!.name)
      
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
            alert(`Order completed for ${selectedCustomer?.name || 'Guest'}!`)
            // reset state
            setOrder([])
            setSelectedPaymentMethod(null)
            setCashAmountGiven('')
            setReceiptImage(null)
            setQrCodeImage(null)
            setSelectedCustomer(null)
            setIsCustomerModalOpen(false)
            setIsPrintModalOpen(true)
          },
          onError: (errors) => {
            console.error('Error creating order:', errors)
            alert('Failed to create order. Please try again.')
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
        if (order.length === 0) {
            alert('No items in the order. Please add items before proceeding to payment.');
            return;
        }
        setIsPaymentModalOpen(true);
    };

    const calculateFinalTotal = () => {
        const subtotal = order.reduce((sum, item) => {
            // Add item price
            let itemTotal = item.price;
            
            // Add any add-ons
            if (item.addOns) {
                itemTotal += item.addOns.reduce((addOnSum, addOn) => addOnSum + addOn.price, 0);
            }
            
            return sum + itemTotal;
        }, 0);
        
        // Apply 20% discount if applicable
        // const discount = subtotal * 0.2;
        return (subtotal).toFixed(2);
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
        } else if ((method.id.toLowerCase() === 'g-cash' || method.id.toLowerCase() === 'debit') && !receiptImage) {
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
                <div className="fixed top-4 right-4 z-50 p-4 rounded shadow-lg bg-white border-l-4 border-green-500">
                    <div className="flex items-center">
                        <div className="font-medium">{notificationMessage}</div>
                        <button 
                            onClick={() => setShowNotification(false)}
                            className="ml-3 text-gray-500 hover:text-gray-800"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}
            <div className="flex flex-col lg:flex-row h-full">
                {/* Product List Section */}
                <div
                    className="lg:w-2/3 w-full p-4 border-b lg:border-b-0 lg:border-r overflow-y-auto"
                    style={{ backgroundColor: primaryColor }}
                >
                    {/* Coffee Section */}
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

                    {/* Blended Drinks */}
                    <ProductCategory
                        title="Blended Drinks"
                        products={menuData["Blended Drinks"].map((item, index) => ({
                            id: 100 + index, // Using 100s range to avoid conflicts
                            ...item,
                            price: item.price || 0
                        }))}
                        onProductClick={handleProductClick}
                    />

                    {/* River Fizz */}
                    <ProductCategory
                        title="River Fizz"
                        products={menuData["River Fizz"].map((item, index) => ({
                            id: 200 + index, // Using 200s range to avoid conflicts
                            ...item,
                            price: item.price || 0
                        }))}
                        onProductClick={handleProductClick}
                    />

                    {/* Black Trails */}
                    <ProductCategory
                        title="Black Trails"
                        products={menuData["Black Trails"].map((item, index) => ({
                            id: 300 + index, // Using 300s range to avoid conflicts
                            ...item,
                            price: item.price || 0
                        }))}
                        onProductClick={handleProductClick}
                    />

                    {/* Greens & Grains */}
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

                    {/* Add-Ons */}
                    <ProductCategory
                        title="Add-Ons"
                        products={menuData["Add-Ons"].map((item, index) => ({
                            id: 500 + index, // Using 500s range to avoid conflicts
                            ...item,
                            price: item.price || 0
                        }))}
                        onProductClick={handleProductClick}
                    />

                    {/* Alternative Milk */}
                    <ProductCategory
                        title="Alternative Milk"
                        products={menuData["Alternative Milk"].map((item, index) => ({
                            id: 1000 + index, // Assign unique ID (using different range to avoid conflicts)
                            name: item.name,
                            price: item.price || 0
                        }))}
                        onProductClick={handleProductClick}
                    />
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

            <PrintModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                selectedPrintOptions={selectedPrintOptions}
                setSelectedPrintOptions={setSelectedPrintOptions}
                onDone={() => {
                    setIsPrintModalOpen(false);
                    setSelectedPrintOptions([]);
                    setOrder([]);
                    setSelectedCustomer(null);
                    setSelectedPaymentMethod(null);
                    setCashAmountGiven('');
                    setReceiptImage(null);
                    setQrCodeImage(null);
                }}
            />
        </div>
    );
}