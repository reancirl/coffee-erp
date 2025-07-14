import React from 'react';

interface OrderSlipProps {
    orderNumber: string;
    orderType: string;
    beeperNumber: string;
    orderItems: any[];
    orderDate: Date;
    totalAmount: number;
}

/**
 * OrderSlip component for thermal printers
 * Sized for standard 80mm receipt width
 * Uses monospace font and simple formatting for thermal printer compatibility
 */
const OrderSlip: React.FC<OrderSlipProps> = ({
    orderNumber,
    orderType,
    beeperNumber,
    orderItems,
    orderDate,
    totalAmount
}) => {
    // Format price safely
    const formatPrice = (price: any): string => {
        const num = Number(price);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    // Format current date for the order slip
    const formatDate = (date: Date): string => {
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // Thermal printer styles
    const slipStyle: React.CSSProperties = {
        width: '80mm', // Standard thermal receipt width
        maxWidth: '80mm',
        fontFamily: 'Courier, monospace', // Monospace font for thermal printing
        fontSize: '12px',
        lineHeight: '1.2',
        whiteSpace: 'pre-wrap',
        padding: '5mm',
        margin: '0 auto',
        backgroundColor: '#fff',
        color: '#000',
        border: '1px dashed #ccc', // Visual indicator on screen only
        boxSizing: 'border-box',
    };

    const headerStyle: React.CSSProperties = {
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: '5mm',
    };

    const lineStyle: React.CSSProperties = {
        marginTop: '2mm',
        marginBottom: '2mm',
    };

    const separatorStyle: React.CSSProperties = {
        borderBottom: '1px dashed #000',
        marginTop: '3mm',
        marginBottom: '3mm',
    };

    // Format item customization details
    const getItemDetails = (item: any): string => {
        let details = '';
        
        // Add variant if selected (e.g., Hot/Iced)
        if (item.selectedVariant) {
            details += `   Variant: ${item.selectedVariant}\n`;
        }
        
        // Add other customizations
        if (item.selectedCustomizations && Object.keys(item.selectedCustomizations).length > 0) {
            Object.entries(item.selectedCustomizations).forEach(([key, value]) => {
                if (key !== 'Variant') { // Avoid duplication with selectedVariant
                    details += `   ${key}: ${value}\n`;
                }
            });
        }
        
        // Add add-ons if any
        if (item.addOns && item.addOns.length > 0) {
            details += '   Add-ons:\n';
            item.addOns.forEach((addon: any) => {
                details += `      ${addon.name} (${formatPrice(addon.price)})\n`;
                if (addon.selectedVariant) {
                    details += `         Variant: ${addon.selectedVariant}\n`;
                }
            });
        }
        
        return details;
    };

    return (
        <div style={slipStyle}>
            {/* Header */}
            <div style={headerStyle}>
                <div>ORDER SLIP</div>
                <div>ORDER #{orderNumber}</div>
            </div>
            
            {/* Order Info */}
            <div style={lineStyle}>Date: {formatDate(orderDate)}</div>
            <div style={lineStyle}>Type: {orderType.toUpperCase()}</div>
            {beeperNumber && <div style={lineStyle}>Beeper #: {beeperNumber}</div>}
            
            {/* Separator */}
            <div style={separatorStyle}></div>
            
            {/* Order Items */}
            <div>
                {orderItems.map((item, index) => (
                    <div key={index}>
                        <div style={lineStyle}>
                            {item.name} - ₱{formatPrice(item.price)}
                        </div>
                        <div style={{ fontSize: '10px' }}>
                            {getItemDetails(item)}
                        </div>
                        {index < orderItems.length - 1 && <div style={{ marginBottom: '2mm' }}></div>}
                    </div>
                ))}
            </div>
            
            {/* Separator */}
            <div style={separatorStyle}></div>
            
            {/* Total */}
            <div style={{ ...lineStyle, fontWeight: 'bold' }}>
                Total Amount: ₱{formatPrice(totalAmount)}
            </div>
            
            {/* Footer */}
            <div style={{ ...headerStyle, marginTop: '5mm' }}>
                <div>KITCHEN COPY</div>
                <div>Thank you!</div>
            </div>
        </div>
    );
};

export default OrderSlip;
