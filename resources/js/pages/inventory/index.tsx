import AppLayout, { withAppShell } from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Package, Plus, Minus, Search, Filter, Download, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inventory',
        href: '/inventory',
    },
];

// Mock data that matches your existing product structure
const mockInventoryData = [
    {
        id: 1,
        name: 'Beans',
        category: 'Coffee',
        currentStock: 45,
        minStock: 20,
        maxStock: 100,
        unit: 'servings',
        cost: 25.00,
        lastUpdated: '2025-01-04',
        status: 'in_stock',
        supplier: 'Coffee Beans Co.',
        location: 'Main Storage'
    },
    {
        id: 2,
        name: 'Milk',
        category: 'Coffee',
        currentStock: 15,
        minStock: 20,
        maxStock: 80,
        unit: 'servings',
        cost: 35.00,
        lastUpdated: '2025-01-03',
        status: 'low_stock',
        supplier: 'Coffee Beans Co.',
        location: 'Main Storage'
    },
    {
        id: 3,
        name: 'Chocolate Chip',
        category: 'Blended Drinks',
        currentStock: 8,
        minStock: 15,
        maxStock: 60,
        unit: 'servings',
        cost: 45.00,
        lastUpdated: '2025-01-02',
        status: 'critical',
        supplier: 'Frappe Mix Ltd.',
        location: 'Cold Storage'
    },
    {
        id: 4,
        name: 'Green Tea',
        category: 'Greens & Grains',
        currentStock: 75,
        minStock: 25,
        maxStock: 120,
        unit: 'servings',
        cost: 30.00,
        lastUpdated: '2025-01-04',
        status: 'in_stock',
        supplier: 'Tea Masters',
        location: 'Dry Storage'
    },
    {
        id: 5,
        name: 'Vanilla Syrup',
        category: 'Add-Ons',
        currentStock: 3,
        minStock: 10,
        maxStock: 50,
        unit: 'bottles',
        cost: 120.00,
        lastUpdated: '2025-01-01',
        status: 'critical',
        supplier: 'Syrup Solutions',
        location: 'Add-on Storage'
    },
];

const getStatusBadge = (status: string, currentStock: number, minStock: number) => {
    if (currentStock === 0) {
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" />Out of Stock</Badge>;
    } else if (currentStock <= minStock * 0.5) {
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Critical</Badge>;
    } else if (currentStock <= minStock) {
        return <Badge variant="secondary" className="flex items-center gap-1"><TrendingDown className="w-3 h-3" />Low Stock</Badge>;
    } else {
        return <Badge variant="default" className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />In Stock</Badge>;
    }
};

export default function InventoryIndex() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [adjustmentType, setAdjustmentType] = useState('add');
    const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
    const [adjustmentReason, setAdjustmentReason] = useState('');

    const categories = ['all', 'Coffee', 'Blended Drinks', 'River Fizz', 'Black Trails', 'Greens & Grains', 'Add-Ons'];
    const statuses = ['all', 'in_stock', 'low_stock', 'critical', 'out_of_stock'];

    const filteredData = mockInventoryData.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        
        let itemStatus = 'in_stock';
        if (item.currentStock === 0) itemStatus = 'out_of_stock';
        else if (item.currentStock <= item.minStock * 0.5) itemStatus = 'critical';
        else if (item.currentStock <= item.minStock) itemStatus = 'low_stock';
        
        const matchesStatus = selectedStatus === 'all' || itemStatus === selectedStatus;
        
        return matchesSearch && matchesCategory && matchesStatus;
    });

    const totalItems = mockInventoryData.length;
    const lowStockItems = mockInventoryData.filter(item => item.currentStock <= item.minStock).length;
    const criticalItems = mockInventoryData.filter(item => item.currentStock <= item.minStock * 0.5).length;
    const totalValue = mockInventoryData.reduce((sum, item) => sum + (item.currentStock * item.cost), 0);

    const handleAdjustment = (item: any) => {
        setSelectedItem(item);
        setIsAdjustmentModalOpen(true);
        setAdjustmentQuantity('');
        setAdjustmentReason('');
    };

    const submitAdjustment = () => {
        // Here you would normally submit to backend
        console.log('Adjustment submitted:', {
            item: selectedItem,
            type: adjustmentType,
            quantity: adjustmentQuantity,
            reason: adjustmentReason
        });
        setIsAdjustmentModalOpen(false);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory Management" />
            
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
                        <p className="text-muted-foreground">
                            Monitor and manage your product inventory levels
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                        <Button className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Bulk Update
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalItems}</div>
                            <p className="text-xs text-muted-foreground">
                                Active inventory items
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                            <TrendingDown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{lowStockItems}</div>
                            <p className="text-xs text-muted-foreground">
                                Items below minimum level
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Critical Stock</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{criticalItems}</div>
                            <p className="text-xs text-muted-foreground">
                                Items requiring immediate attention
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₱{totalValue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                Current inventory value
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
                                        placeholder="Search products..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(category => (
                                        <SelectItem key={category} value={category}>
                                            {category === 'all' ? 'All Categories' : category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map(status => (
                                        <SelectItem key={status} value={status}>
                                            {status === 'all' ? 'All Status' : 
                                             status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Inventory Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Inventory Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Current Stock</TableHead>
                                        <TableHead>Min/Max</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Unit Cost</TableHead>
                                        <TableHead>Total Value</TableHead>
                                        <TableHead>Last Updated</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{item.name}</div>
                                                    <div className="text-sm text-muted-foreground">{item.supplier}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{item.category}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {item.currentStock} {item.unit}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div>Min: {item.minStock}</div>
                                                    <div>Max: {item.maxStock}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(item.status, item.currentStock, item.minStock)}
                                            </TableCell>
                                            <TableCell>₱{item.cost.toFixed(2)}</TableCell>
                                            <TableCell>₱{(item.currentStock * item.cost).toFixed(2)}</TableCell>
                                            <TableCell>{item.lastUpdated}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleAdjustment(item)}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Adjust
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Stock Adjustment Modal */}
                <Dialog open={isAdjustmentModalOpen} onOpenChange={setIsAdjustmentModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Stock Adjustment</DialogTitle>
                        </DialogHeader>
                        {selectedItem && (
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-sm font-medium">Product</Label>
                                    <p className="text-sm text-muted-foreground">{selectedItem.name}</p>
                                    <p className="text-sm text-muted-foreground">Current Stock: {selectedItem.currentStock} {selectedItem.unit}</p>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="adjustment-type">Adjustment Type</Label>
                                    <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="add">Add Stock</SelectItem>
                                            <SelectItem value="remove">Remove Stock</SelectItem>
                                            <SelectItem value="set">Set Stock Level</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        value={adjustmentQuantity}
                                        onChange={(e) => setAdjustmentQuantity(e.target.value)}
                                        placeholder="Enter quantity"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="reason">Reason</Label>
                                    <Textarea
                                        id="reason"
                                        value={adjustmentReason}
                                        onChange={(e) => setAdjustmentReason(e.target.value)}
                                        placeholder="Enter reason for adjustment..."
                                        rows={3}
                                    />
                                </div>
                                
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline" onClick={() => setIsAdjustmentModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={submitAdjustment}>
                                        Apply Adjustment
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

InventoryIndex.layout = withAppShell;
