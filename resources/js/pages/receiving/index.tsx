import AppLayout, { withAppShell } from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardList, Search, Download, Calendar, Package, CheckCircle, AlertTriangle, XCircle, Eye, Truck } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Receiving Orders',
        href: '/receiving',
    },
];

// Mock receiving data
const mockReceivingOrders = [
    {
        id: 1,
        poNumber: 'PO-2025-002',
        supplier: 'Dairy Fresh Ltd.',
        receivedDate: '2025-01-04',
        expectedDate: '2025-01-04',
        status: 'completed',
        receivedBy: 'Store Manager',
        items: [
            { product: 'Fresh Milk', ordered: 100, received: 100, unit: 'L', condition: 'good', notes: '' },
            { product: 'Heavy Cream', ordered: 20, received: 18, unit: 'L', condition: 'good', notes: '2L damaged in transit' }
        ],
        totalOrdered: 8500.00,
        totalReceived: 8300.00,
        discrepancies: 1,
        notes: 'Minor damage to 2L cream containers'
    },
    {
        id: 2,
        poNumber: 'PO-2025-003',
        supplier: 'Sweet Syrups Inc.',
        receivedDate: '2025-01-05',
        expectedDate: '2025-01-06',
        status: 'partial',
        receivedBy: 'Admin User',
        items: [
            { product: 'Vanilla Syrup', ordered: 24, received: 24, unit: 'bottles', condition: 'good', notes: '' },
            { product: 'Caramel Syrup', ordered: 12, received: 0, unit: 'bottles', condition: 'missing', notes: 'Not included in shipment' }
        ],
        totalOrdered: 12000.00,
        totalReceived: 8400.00,
        discrepancies: 1,
        notes: 'Caramel syrup missing from shipment, supplier contacted'
    },
    {
        id: 3,
        poNumber: 'PO-2025-001',
        supplier: 'Coffee Beans Co.',
        receivedDate: null,
        expectedDate: '2025-01-08',
        status: 'pending',
        receivedBy: null,
        items: [
            { product: 'Arabica Beans', ordered: 50, received: 0, unit: 'kg', condition: 'pending', notes: '' },
            { product: 'Espresso Blend', ordered: 10, received: 0, unit: 'kg', condition: 'pending', notes: '' }
        ],
        totalOrdered: 25000.00,
        totalReceived: 0,
        discrepancies: 0,
        notes: 'Awaiting delivery'
    }
];

type ReceivingOrder = (typeof mockReceivingOrders)[number];

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'pending':
            return <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />Pending
            </Badge>;
        case 'partial':
            return <Badge variant="default" className="bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 flex items-center gap-1">
                <Package className="w-3 h-3" />Partial
            </Badge>;
        case 'completed':
            return <Badge variant="default" className="bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />Completed
            </Badge>;
        case 'discrepancy':
            return <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="w-3 h-3" />Discrepancy
            </Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

const getConditionBadge = (condition: string) => {
    switch (condition) {
        case 'good':
            return <Badge variant="default" className="bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300">Good</Badge>;
        case 'damaged':
            return <Badge variant="destructive">Damaged</Badge>;
        case 'missing':
            return <Badge variant="destructive">Missing</Badge>;
        case 'pending':
            return <Badge variant="secondary">Pending</Badge>;
        default:
            return <Badge variant="outline">{condition}</Badge>;
    }
};

export default function ReceivingIndex() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<ReceivingOrder | null>(null);

    const statuses = ['all', 'pending', 'partial', 'completed', 'discrepancy'];

    const filteredData = mockReceivingOrders.filter(order => {
        const matchesSearch = order.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.supplier.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
        
        return matchesSearch && matchesStatus;
    });

    const totalOrders = mockReceivingOrders.length;
    const pendingOrders = mockReceivingOrders.filter(o => o.status === 'pending').length;
    const completedOrders = mockReceivingOrders.filter(o => o.status === 'completed').length;
    const totalDiscrepancies = mockReceivingOrders.reduce((sum, o) => sum + o.discrepancies, 0);

    const handleReceiveOrder = (order: ReceivingOrder) => {
        setSelectedOrder(order);
        setIsReceiveModalOpen(true);
    };

    const handleViewOrder = (order: ReceivingOrder) => {
        setSelectedOrder(order);
        setIsViewModalOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Receiving Orders" />
            
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Receiving Orders</h1>
                        <p className="text-muted-foreground">
                            Track and manage incoming deliveries
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                            <ClipboardList className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalOrders}</div>
                            <p className="text-xs text-muted-foreground">
                                Receiving orders
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingOrders}</div>
                            <p className="text-xs text-muted-foreground">
                                Awaiting delivery
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{completedOrders}</div>
                            <p className="text-xs text-muted-foreground">
                                Successfully received
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Discrepancies</CardTitle>
                            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{totalDiscrepancies}</div>
                            <p className="text-xs text-muted-foreground">
                                Items with issues
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search receiving orders..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map(status => (
                                        <SelectItem key={status} value={status}>
                                            {status === 'all' ? 'All Status' : 
                                             status.charAt(0).toUpperCase() + status.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Receiving Orders Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Receiving Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>PO Number</TableHead>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>Expected Date</TableHead>
                                        <TableHead>Received Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Received By</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell>
                                                <div className="font-medium">{order.poNumber}</div>
                                                {order.discrepancies > 0 && (
                                                    <div className="text-sm text-red-600 dark:text-red-400">
                                                        {order.discrepancies} discrepancy(ies)
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>{order.supplier}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(order.expectedDate).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {order.receivedDate ? (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(order.receivedDate).toLocaleDateString()}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                                            <TableCell>
                                                {order.receivedBy || <span className="text-muted-foreground">-</span>}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewOrder(order)}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        View
                                                    </Button>
                                                    {order.status === 'pending' && (
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            onClick={() => handleReceiveOrder(order)}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Truck className="w-3 h-3" />
                                                            Receive
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Receive Order Modal */}
                <Dialog open={isReceiveModalOpen} onOpenChange={setIsReceiveModalOpen}>
                    <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Receive Order - {selectedOrder?.poNumber}</DialogTitle>
                        </DialogHeader>
                        {selectedOrder && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Supplier</Label>
                                        <p className="text-sm text-muted-foreground">{selectedOrder.supplier}</p>
                                    </div>
                                    <div>
                                        <Label>Expected Date</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(selectedOrder.expectedDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>Items to Receive</Label>
                                    <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Product</TableHead>
                                                    <TableHead>Ordered</TableHead>
                                                    <TableHead>Received</TableHead>
                                                    <TableHead>Condition</TableHead>
                                                    <TableHead>Notes</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedOrder.items.map((item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{item.product}</TableCell>
                                                        <TableCell>{item.ordered} {item.unit}</TableCell>
                                                        <TableCell>
                                                            <Input 
                                                                type="number" 
                                                                defaultValue={item.ordered}
                                                                className="w-20"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Select defaultValue="good">
                                                                <SelectTrigger className="w-32">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="good">Good</SelectItem>
                                                                    <SelectItem value="damaged">Damaged</SelectItem>
                                                                    <SelectItem value="missing">Missing</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input 
                                                                placeholder="Notes..."
                                                                className="w-32"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="receiving-notes">Receiving Notes</Label>
                                    <Textarea 
                                        id="receiving-notes" 
                                        placeholder="Any notes about the delivery condition, discrepancies, etc..."
                                        rows={3}
                                    />
                                </div>
                                
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline" onClick={() => setIsReceiveModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={() => setIsReceiveModalOpen(false)}>
                                        Complete Receiving
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* View Order Modal */}
                <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                    <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Receiving Details - {selectedOrder?.poNumber}</DialogTitle>
                        </DialogHeader>
                        {selectedOrder && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold">{selectedOrder.poNumber}</h3>
                                        <p className="text-muted-foreground">Supplier: {selectedOrder.supplier}</p>
                                    </div>
                                    {getStatusBadge(selectedOrder.status)}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="font-medium mb-1">Expected Date</div>
                                        <p className="text-muted-foreground">
                                            {new Date(selectedOrder.expectedDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <div className="font-medium mb-1">Received Date</div>
                                        <p className="text-muted-foreground">
                                            {selectedOrder.receivedDate ? 
                                                new Date(selectedOrder.receivedDate).toLocaleDateString() : 
                                                'Not received yet'
                                            }
                                        </p>
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="font-medium mb-2">Items</div>
                                    <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Product</TableHead>
                                                    <TableHead>Ordered</TableHead>
                                                    <TableHead>Received</TableHead>
                                                    <TableHead>Condition</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedOrder.items.map((item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            <div>{item.product}</div>
                                                            {item.notes && (
                                                                <div className="text-xs text-muted-foreground mt-1">
                                                                    {item.notes}
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{item.ordered} {item.unit}</TableCell>
                                                        <TableCell>
                                                            {item.received > 0 ? `${item.received} ${item.unit}` : '-'}
                                                        </TableCell>
                                                        <TableCell>{getConditionBadge(item.condition)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                    <div>
                                        <div className="font-medium mb-1">Total Ordered</div>
                                        <div className="text-lg">₱{selectedOrder.totalOrdered.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium mb-1">Total Received</div>
                                        <div className="text-lg">₱{selectedOrder.totalReceived.toLocaleString()}</div>
                                    </div>
                                </div>
                                
                                {selectedOrder.notes && (
                                    <div>
                                        <div className="font-medium mb-2">Notes</div>
                                        <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                                            {selectedOrder.notes}
                                        </p>
                                    </div>
                                )}
                                
                                {selectedOrder.receivedBy && (
                                    <div className="text-sm text-muted-foreground">
                                        Received by {selectedOrder.receivedBy} on {new Date(selectedOrder.receivedDate).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

ReceivingIndex.layout = withAppShell;
