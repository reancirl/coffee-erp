import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Coffee, Users, CheckCircle, RefreshCw } from 'lucide-react';

interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    variant?: string;
    customizations?: { [key: string]: string };
    add_ons: Array<{
        product_name: string;
        variant?: string;
        customizations?: { [key: string]: string };
    }>;
}

interface Order {
    id: number;
    order_number: string;
    order_type: string;
    beeper_number?: string;
    created_at: string;
    time_elapsed: string;
    items: OrderItem[];
    notes?: string;
}

interface Props {
    orders: Order[];
}

export default function KitchenQueue({ orders: initialOrders }: Props) {
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [clickCounts, setClickCounts] = useState<{ [key: number]: number }>({});
    const [completingOrders, setCompletingOrders] = useState<Set<number>>(new Set());
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Manual refresh function
    const refreshQueue = async () => {
        setIsRefreshing(true);
        try {
            const response = await fetch('/kitchen-queue/data');
            const data = await response.json();
            setOrders(data.orders);
        } catch (error) {
            console.error('Error fetching queue data:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Handle triple-click to complete order
    const handleOrderClick = (orderId: number) => {
        const currentCount = clickCounts[orderId] || 0;
        const newCount = currentCount + 1;

        setClickCounts(prev => ({
            ...prev,
            [orderId]: newCount
        }));

        // Reset click count after 2 seconds if not triple-clicked
        setTimeout(() => {
            setClickCounts(prev => {
                const updated = { ...prev };
                if (updated[orderId] === newCount) {
                    delete updated[orderId];
                }
                return updated;
            });
        }, 2000);

        // If triple-clicked, complete the order
        if (newCount === 3) {
            completeOrder(orderId);
        }
    };

    const completeOrder = async (orderId: number) => {
        setCompletingOrders(prev => new Set(prev).add(orderId));

        try {
            // Use Inertia router for proper CSRF handling
            router.patch(`/kitchen-queue/${orderId}/complete`, {}, {
                onSuccess: () => {
                    // Remove the completed order from the queue
                    setOrders(prev => prev.filter(order => order.id !== orderId));
                    setClickCounts(prev => {
                        const updated = { ...prev };
                        delete updated[orderId];
                        return updated;
                    });
                },
                onError: (errors) => {
                    console.error('Failed to complete order:', errors);
                },
                onFinish: () => {
                    setCompletingOrders(prev => {
                        const updated = new Set(prev);
                        updated.delete(orderId);
                        return updated;
                    });
                }
            });
        } catch (error) {
            console.error('Error completing order:', error);
            setCompletingOrders(prev => {
                const updated = new Set(prev);
                updated.delete(orderId);
                return updated;
            });
        }
    };

    const getOrderTypeIcon = (orderType: string) => {
        switch (orderType) {
            case 'dine-in':
                return <Users className="h-4 w-4" />;
            case 'takeout':
                return <Coffee className="h-4 w-4" />;
            default:
                return <Coffee className="h-4 w-4" />;
        }
    };

    const getTimeElapsedColor = (timeElapsed: string) => {
        const minutes = parseInt(timeElapsed.replace(/[^\d]/g, ''));
        if (minutes > 15) return 'text-red-600 bg-red-50';
        if (minutes > 10) return 'text-orange-600 bg-orange-50';
        return 'text-green-600 bg-green-50';
    };

    const formatCustomizations = (customizations?: { [key: string]: string }) => {
        if (!customizations || Object.keys(customizations).length === 0) return null;
        return Object.entries(customizations)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
    };

    return (
        <>
            <Head title="Kitchen Queue" />
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Kitchen Queue</h1>
                    <p className="text-gray-600 mt-2">
                        Orders are displayed in first-in-first-out order. Triple-click an order to mark as completed.
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Badge variant="outline" className="text-sm">
                                <Clock className="h-3 w-3 mr-1" />
                                {orders.length} pending orders
                            </Badge>
                        </div>
                        <Button 
                            onClick={refreshQueue}
                            disabled={isRefreshing}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Refreshing...' : 'Refresh Queue'}
                        </Button>
                    </div>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-12">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h2>
                        <p className="text-gray-600">No pending orders in the queue.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {orders.map((order) => (
                            <Card
                                key={order.id}
                                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                                    clickCounts[order.id] > 0 ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                                } ${completingOrders.has(order.id) ? 'opacity-50' : ''}`}
                                onClick={() => handleOrderClick(order.id)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-bold">
                                            {order.order_number}
                                        </CardTitle>
                                        <Badge className={`text-xs ${getTimeElapsedColor(order.time_elapsed)}`}>
                                            <Clock className="h-3 w-3 mr-1" />
                                            {order.time_elapsed}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        {getOrderTypeIcon(order.order_type)}
                                        <span className="capitalize">{order.order_type}</span>
                                        {order.beeper_number && (
                                            <Badge variant="secondary" className="text-xs">
                                                #{order.beeper_number}
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {order.items.map((item, index) => (
                                            <div key={index} className="border-l-2 border-coffee-600 pl-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-gray-900">
                                                        {item.product_name}
                                                    </span>
                                                    <Badge variant="outline" className="text-xs">
                                                        x{item.quantity}
                                                    </Badge>
                                                </div>
                                                {item.variant && (
                                                    <p className="text-sm text-gray-600 capitalize">
                                                        {item.variant}
                                                    </p>
                                                )}
                                                {formatCustomizations(item.customizations) && (
                                                    <p className="text-xs text-gray-500">
                                                        {formatCustomizations(item.customizations)}
                                                    </p>
                                                )}
                                                {item.add_ons.length > 0 && (
                                                    <div className="mt-1">
                                                        <p className="text-xs font-medium text-gray-700">Add-ons:</p>
                                                        {item.add_ons.map((addOn, addOnIndex) => (
                                                            <p key={addOnIndex} className="text-xs text-gray-600 ml-2">
                                                                • {addOn.product_name}
                                                                {addOn.variant && ` (${addOn.variant})`}
                                                                {formatCustomizations(addOn.customizations) && 
                                                                    ` - ${formatCustomizations(addOn.customizations)}`
                                                                }
                                                            </p>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {order.notes && (
                                            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                                <p className="text-xs font-medium text-yellow-800">Notes:</p>
                                                <p className="text-sm text-yellow-700">{order.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                    {clickCounts[order.id] > 0 && (
                                        <div className="mt-3 text-center">
                                            <Badge variant="default" className="text-xs">
                                                Click {3 - clickCounts[order.id]} more times to complete
                                            </Badge>
                                        </div>
                                    )}
                                    {completingOrders.has(order.id) && (
                                        <div className="mt-3 text-center">
                                            <Badge variant="default" className="text-xs bg-green-600">
                                                Completing order...
                                            </Badge>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
