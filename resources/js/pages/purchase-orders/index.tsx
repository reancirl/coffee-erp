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
import { ShoppingCart, Plus, Search, Download, Calendar, DollarSign, Clock, CheckCircle, XCircle, Eye, Edit } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Purchase Orders',
        href: '/purchase-orders',
    },
];

// Mock purchase order data
const mockPurchaseOrders = [
    {
        id: 1,
        poNumber: 'PO-2025-001',
        supplier: 'Coffee Beans Co.',
        orderDate: '2025-01-03',
        expectedDate: '2025-01-08',
        status: 'pending',
        totalAmount: 25000.00,
        items: [
            { product: 'Arabica Beans', quantity: 50, unit: 'kg', unitPrice: 450.00, total: 22500.00 },
            { product: 'Espresso Blend', quantity: 10, unit: 'kg', unitPrice: 250.00, total: 2500.00 }
        ],
        notes: 'Regular monthly order',
        createdBy: 'Admin User'
    },
    {
        id: 2,
        poNumber: 'PO-2025-002',
        supplier: 'Dairy Fresh Ltd.',
        orderDate: '2025-01-02',
        expectedDate: '2025-01-04',
        status: 'approved',
        totalAmount: 8500.00,
        items: [
            { product: 'Fresh Milk', quantity: 100, unit: 'L', unitPrice: 65.00, total: 6500.00 },
            { product: 'Heavy Cream', quantity: 20, unit: 'L', unitPrice: 100.00, total: 2000.00 }
        ],
        notes: 'Urgent order for weekend rush',
        createdBy: 'Store Manager'
    },
    {
        id: 3,
        poNumber: 'PO-2025-003',
        supplier: 'Sweet Syrups Inc.',
        orderDate: '2024-12-30',
        expectedDate: '2025-01-06',
        status: 'received',
        totalAmount: 12000.00,
        items: [
            { product: 'Vanilla Syrup', quantity: 24, unit: 'bottles', unitPrice: 350.00, total: 8400.00 },
            { product: 'Caramel Syrup', quantity: 12, unit: 'bottles', unitPrice: 300.00, total: 3600.00 }
        ],
        notes: 'New year stock replenishment',
        createdBy: 'Admin User'
    },
    {
        id: 4,
        poNumber: 'PO-2024-089',
        supplier: 'Paper & Packaging Co.',
        orderDate: '2024-12-28',
        expectedDate: '2024-12-31',
        status: 'cancelled',
        totalAmount: 5500.00,
        items: [
            { product: 'Coffee Cups', quantity: 1000, unit: 'pcs', unitPrice: 4.50, total: 4500.00 },
            { product: 'Takeaway Bags', quantity: 500, unit: 'pcs', unitPrice: 2.00, total: 1000.00 }
        ],
        notes: 'Cancelled due to quality issues',
        createdBy: 'Store Manager'
    }
];

type PurchaseOrder = (typeof mockPurchaseOrders)[number];

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'pending':
            return <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 flex items-center gap-1">
                <Clock className="w-3 h-3" />Pending
            </Badge>;
        case 'approved':
            return <Badge variant="default" className="bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />Approved
            </Badge>;
        case 'received':
            return <Badge variant="default" className="bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />Received
            </Badge>;
        case 'cancelled':
            return <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="w-3 h-3" />Cancelled
            </Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

export default function PurchaseOrdersIndex() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [isCreatePOModalOpen, setIsCreatePOModalOpen] = useState(false);
    const [isViewPOModalOpen, setIsViewPOModalOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

    const statuses = ['all', 'pending', 'approved', 'received', 'cancelled'];

    const filteredData = mockPurchaseOrders.filter(po => {
        const matchesSearch = po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            po.supplier.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = selectedStatus === 'all' || po.status === selectedStatus;
        
        return matchesSearch && matchesStatus;
    });

    const totalPOs = mockPurchaseOrders.length;
    const pendingPOs = mockPurchaseOrders.filter(po => po.status === 'pending').length;
    const approvedPOs = mockPurchaseOrders.filter(po => po.status === 'approved').length;
    const totalValue = mockPurchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);

    const handleViewPO = (po: PurchaseOrder) => {
        setSelectedPO(po);
        setIsViewPOModalOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Purchase Orders" />
            
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
                        <p className="text-muted-foreground">
                            Manage purchase orders and supplier requests
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                        <Button 
                            className="flex items-center gap-2"
                            onClick={() => setIsCreatePOModalOpen(true)}
                        >
                            <Plus className="w-4 h-4" />
                            Create PO
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalPOs}</div>
                            <p className="text-xs text-muted-foreground">
                                All purchase orders
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingPOs}</div>
                            <p className="text-xs text-muted-foreground">
                                Awaiting approval
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Approved</CardTitle>
                            <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{approvedPOs}</div>
                            <p className="text-xs text-muted-foreground">
                                Ready for delivery
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₱{totalValue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                All orders value
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
                                        placeholder="Search purchase orders..."
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

                {/* Purchase Orders Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Purchase Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>PO Number</TableHead>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>Order Date</TableHead>
                                        <TableHead>Expected Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Total Amount</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.map((po) => (
                                        <TableRow key={po.id}>
                                            <TableCell>
                                                <div className="font-medium">{po.poNumber}</div>
                                                <div className="text-sm text-muted-foreground">by {po.createdBy}</div>
                                            </TableCell>
                                            <TableCell>{po.supplier}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(po.orderDate).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(po.expectedDate).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(po.status)}</TableCell>
                                            <TableCell>₱{po.totalAmount.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewPO(po)}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        View
                                                    </Button>
                                                    {po.status === 'pending' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                            Edit
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

                {/* Create PO Modal */}
                <Dialog open={isCreatePOModalOpen} onOpenChange={setIsCreatePOModalOpen}>
                    <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create Purchase Order</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="supplier">Supplier</Label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select supplier" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="coffee-beans">Coffee Beans Co.</SelectItem>
                                            <SelectItem value="dairy-fresh">Dairy Fresh Ltd.</SelectItem>
                                            <SelectItem value="sweet-syrups">Sweet Syrups Inc.</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expected-date">Expected Delivery</Label>
                                    <Input id="expected-date" type="date" />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Order Items</Label>
                                <div className="border rounded-lg p-4 space-y-3">
                                    <div className="grid grid-cols-5 gap-2 text-sm font-medium">
                                        <div>Product</div>
                                        <div>Quantity</div>
                                        <div>Unit</div>
                                        <div>Unit Price</div>
                                        <div>Total</div>
                                    </div>
                                    <div className="grid grid-cols-5 gap-2">
                                        <Select>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select product" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="arabica">Arabica Beans</SelectItem>
                                                <SelectItem value="robusta">Robusta Beans</SelectItem>
                                                <SelectItem value="milk">Fresh Milk</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Input type="number" placeholder="Qty" />
                                        <Input placeholder="Unit" />
                                        <Input type="number" placeholder="Price" />
                                        <Input placeholder="₱0.00" disabled />
                                    </div>
                                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        Add Item
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea id="notes" placeholder="Any special instructions or notes..." rows={3} />
                            </div>
                            
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setIsCreatePOModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={() => setIsCreatePOModalOpen(false)}>
                                    Create Purchase Order
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* View PO Modal */}
                <Dialog open={isViewPOModalOpen} onOpenChange={setIsViewPOModalOpen}>
                    <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Purchase Order Details</DialogTitle>
                        </DialogHeader>
                        {selectedPO && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold">{selectedPO.poNumber}</h3>
                                        <p className="text-muted-foreground">Supplier: {selectedPO.supplier}</p>
                                    </div>
                                    {getStatusBadge(selectedPO.status)}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="font-medium mb-1">Order Date</div>
                                        <p className="text-muted-foreground">{new Date(selectedPO.orderDate).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <div className="font-medium mb-1">Expected Date</div>
                                        <p className="text-muted-foreground">{new Date(selectedPO.expectedDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="font-medium mb-2">Order Items</div>
                                    <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Product</TableHead>
                                                    <TableHead>Qty</TableHead>
                                                    <TableHead>Unit Price</TableHead>
                                                    <TableHead>Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedPO.items.map((item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{item.product}</TableCell>
                                                        <TableCell>{item.quantity} {item.unit}</TableCell>
                                                        <TableCell>₱{item.unitPrice.toLocaleString()}</TableCell>
                                                        <TableCell>₱{item.total.toLocaleString()}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center pt-2 border-t">
                                    <div className="text-lg font-semibold">Total Amount</div>
                                    <div className="text-lg font-bold">₱{selectedPO.totalAmount.toLocaleString()}</div>
                                </div>
                                
                                {selectedPO.notes && (
                                    <div>
                                        <div className="font-medium mb-2">Notes</div>
                                        <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                                            {selectedPO.notes}
                                        </p>
                                    </div>
                                )}
                                
                                <div className="text-sm text-muted-foreground">
                                    Created by {selectedPO.createdBy} on {new Date(selectedPO.orderDate).toLocaleDateString()}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

PurchaseOrdersIndex.layout = withAppShell;
