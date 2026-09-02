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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Truck, Plus, Search, Filter, Download, Mail, Phone, MapPin, Star, Building, Package, Edit, Trash2, Eye, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Suppliers',
        href: '/suppliers',
    },
];

// Mock supplier data
const mockSupplierData = [
    {
        id: 1,
        name: 'Coffee Beans Co.',
        contactPerson: 'John Smith',
        email: 'john@coffeebeans.com',
        phone: '+63 912 345 6789',
        address: '123 Business Ave, Manila, Philippines',
        website: 'www.coffeebeans.com',
        status: 'active',
        rating: 4.8,
        category: 'Coffee & Beverages',
        paymentTerms: 'Net 30',
        leadTime: 5,
        totalOrders: 45,
        totalSpent: 125000.00,
        lastOrderDate: '2025-01-02',
        products: ['Arabica Beans', 'Robusta Beans', 'Espresso Blend', 'House Blend'],
        notes: 'Reliable supplier with consistent quality',
        taxId: 'TIN-123456789',
        bankAccount: 'BPI - 1234567890'
    },
    {
        id: 2,
        name: 'Dairy Fresh Ltd.',
        contactPerson: 'Maria Santos',
        email: 'maria@dairyfresh.com',
        phone: '+63 912 345 6788',
        address: '456 Milk Street, Quezon City, Philippines',
        website: 'www.dairyfresh.com',
        status: 'active',
        rating: 4.5,
        category: 'Dairy Products',
        paymentTerms: 'Net 15',
        leadTime: 2,
        totalOrders: 78,
        totalSpent: 89500.00,
        lastOrderDate: '2025-01-03',
        products: ['Fresh Milk', 'Heavy Cream', 'Butter', 'Cheese'],
        notes: 'Fast delivery, good quality dairy products',
        taxId: 'TIN-987654321',
        bankAccount: 'BDO - 9876543210'
    },
    {
        id: 3,
        name: 'Sweet Syrups Inc.',
        contactPerson: 'Alex Rivera',
        email: 'alex@sweetsyrups.com',
        phone: '+63 912 345 6787',
        address: '789 Sugar Lane, Makati, Philippines',
        website: 'www.sweetsyrups.com',
        status: 'pending',
        rating: 4.2,
        category: 'Syrups & Flavoring',
        paymentTerms: 'Net 30',
        leadTime: 7,
        totalOrders: 23,
        totalSpent: 45000.00,
        lastOrderDate: '2024-12-28',
        products: ['Vanilla Syrup', 'Caramel Syrup', 'Hazelnut Syrup', 'Sugar-free Options'],
        notes: 'New supplier, trial period',
        taxId: 'TIN-456789123',
        bankAccount: 'Metrobank - 4567891230'
    },
    {
        id: 4,
        name: 'Paper & Packaging Co.',
        contactPerson: 'Sarah Kim',
        email: 'sarah@paperpack.com',
        phone: '+63 912 345 6786',
        address: '321 Industrial Blvd, Pasig, Philippines',
        website: 'www.paperpack.com',
        status: 'inactive',
        rating: 3.8,
        category: 'Packaging & Supplies',
        paymentTerms: 'COD',
        leadTime: 3,
        totalOrders: 12,
        totalSpent: 25000.00,
        lastOrderDate: '2024-11-15',
        products: ['Coffee Cups', 'Lids', 'Napkins', 'Takeaway Bags'],
        notes: 'Quality issues, looking for replacement',
        taxId: 'TIN-789123456',
        bankAccount: 'PNB - 7891234560'
    }
];

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'active':
            return <Badge variant="default" className="bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />Active
            </Badge>;
        case 'pending':
            return <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 flex items-center gap-1">
                <Clock className="w-3 h-3" />Pending
            </Badge>;
        case 'inactive':
            return <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />Inactive
            </Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
        <Star
            key={i}
            className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
        />
    ));
};

export default function SuppliersIndex() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
    const [isViewSupplierModalOpen, setIsViewSupplierModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

    const categories = ['all', 'Coffee & Beverages', 'Dairy Products', 'Syrups & Flavoring', 'Packaging & Supplies', 'Equipment'];
    const statuses = ['all', 'active', 'pending', 'inactive'];
    const paymentTerms = ['COD', 'Net 15', 'Net 30', 'Net 45', 'Net 60'];

    const filteredData = mockSupplierData.filter(supplier => {
        const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            supplier.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || supplier.category === selectedCategory;
        const matchesStatus = selectedStatus === 'all' || supplier.status === selectedStatus;
        
        return matchesSearch && matchesCategory && matchesStatus;
    });

    const totalSuppliers = mockSupplierData.length;
    const activeSuppliers = mockSupplierData.filter(sup => sup.status === 'active').length;
    const pendingSuppliers = mockSupplierData.filter(sup => sup.status === 'pending').length;
    const totalSpent = mockSupplierData.reduce((sum, sup) => sum + sup.totalSpent, 0);

    const handleViewSupplier = (supplier: any) => {
        setSelectedSupplier(supplier);
        setIsViewSupplierModalOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Supplier Management" />
            
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Supplier Management</h1>
                        <p className="text-muted-foreground">
                            Manage your supplier database and relationships
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                        <Button 
                            className="flex items-center gap-2"
                            onClick={() => setIsAddSupplierModalOpen(true)}
                        >
                            <Plus className="w-4 h-4" />
                            Add Supplier
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
                            <Truck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalSuppliers}</div>
                            <p className="text-xs text-muted-foreground">
                                Registered suppliers
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{activeSuppliers}</div>
                            <p className="text-xs text-muted-foreground">
                                Currently working with
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingSuppliers}</div>
                            <p className="text-xs text-muted-foreground">
                                Awaiting approval
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                            <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₱{totalSpent.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                All-time purchases
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
                                        placeholder="Search suppliers..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-full sm:w-[200px]">
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
                                             status.charAt(0).toUpperCase() + status.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Suppliers Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Supplier Directory</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Rating</TableHead>
                                        <TableHead>Lead Time</TableHead>
                                        <TableHead>Total Spent</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.map((supplier) => (
                                        <TableRow key={supplier.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${supplier.name}`} />
                                                        <AvatarFallback>
                                                            {supplier.name.split(' ').map(n => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{supplier.name}</div>
                                                        <div className="text-sm text-muted-foreground">{supplier.contactPerson}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{supplier.category}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {supplier.email}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <Phone className="w-3 h-3" />
                                                        {supplier.phone}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {getRatingStars(supplier.rating)}
                                                    <span className="text-sm ml-1">{supplier.rating}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{supplier.leadTime} days</TableCell>
                                            <TableCell>₱{supplier.totalSpent.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewSupplier(supplier)}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        View
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Edit className="w-3 h-3" />
                                                        Edit
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

                {/* Add Supplier Modal */}
                <Dialog open={isAddSupplierModalOpen} onOpenChange={setIsAddSupplierModalOpen}>
                    <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add New Supplier</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="supplier-name">Company Name</Label>
                                    <Input id="supplier-name" placeholder="Enter company name" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contact-person">Contact Person</Label>
                                    <Input id="contact-person" placeholder="Enter contact person" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="Enter email address" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" placeholder="Enter phone number" />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea id="address" placeholder="Enter complete address" rows={2} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.filter(c => c !== 'all').map(category => (
                                                <SelectItem key={category} value={category}>{category}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="payment-terms">Payment Terms</Label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select payment terms" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {paymentTerms.map(term => (
                                                <SelectItem key={term} value={term}>{term}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="lead-time">Lead Time (days)</Label>
                                    <Input id="lead-time" type="number" placeholder="Enter lead time" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="website">Website</Label>
                                    <Input id="website" placeholder="Enter website URL" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tax-id">Tax ID</Label>
                                    <Input id="tax-id" placeholder="Enter tax identification number" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bank-account">Bank Account</Label>
                                    <Input id="bank-account" placeholder="Enter bank account details" />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="products">Products/Services</Label>
                                <Textarea id="products" placeholder="List main products or services (comma separated)" rows={2} />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea id="notes" placeholder="Any additional notes about this supplier..." rows={3} />
                            </div>
                            
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setIsAddSupplierModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={() => setIsAddSupplierModalOpen(false)}>
                                    Add Supplier
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* View Supplier Modal */}
                <Dialog open={isViewSupplierModalOpen} onOpenChange={setIsViewSupplierModalOpen}>
                    <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Supplier Details</DialogTitle>
                        </DialogHeader>
                        {selectedSupplier && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedSupplier.name}`} />
                                        <AvatarFallback className="text-lg">
                                            {selectedSupplier.name.split(' ').map((n: string) => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold">{selectedSupplier.name}</h3>
                                        <p className="text-muted-foreground">{selectedSupplier.contactPerson}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {getStatusBadge(selectedSupplier.status)}
                                            <Badge variant="outline">{selectedSupplier.category}</Badge>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Mail className="w-4 h-4" />
                                            <span className="font-medium">Email</span>
                                        </div>
                                        <p className="text-muted-foreground">{selectedSupplier.email}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Phone className="w-4 h-4" />
                                            <span className="font-medium">Phone</span>
                                        </div>
                                        <p className="text-muted-foreground">{selectedSupplier.phone}</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin className="w-4 h-4" />
                                        <span className="font-medium">Address</span>
                                    </div>
                                    <p className="text-muted-foreground text-sm">{selectedSupplier.address}</p>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <div className="font-medium mb-1">Rating</div>
                                        <div className="flex items-center gap-1">
                                            {getRatingStars(selectedSupplier.rating)}
                                            <span className="ml-1">{selectedSupplier.rating}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-medium mb-1">Lead Time</div>
                                        <p className="text-muted-foreground">{selectedSupplier.leadTime} days</p>
                                    </div>
                                    <div>
                                        <div className="font-medium mb-1">Payment Terms</div>
                                        <p className="text-muted-foreground">{selectedSupplier.paymentTerms}</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="font-medium mb-1">Total Orders</div>
                                        <p className="text-muted-foreground">{selectedSupplier.totalOrders}</p>
                                    </div>
                                    <div>
                                        <div className="font-medium mb-1">Total Spent</div>
                                        <p className="text-muted-foreground">₱{selectedSupplier.totalSpent.toLocaleString()}</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Package className="w-4 h-4" />
                                        <span className="font-medium">Products/Services</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedSupplier.products.map((product: string) => (
                                            <Badge key={product} variant="outline" className="text-xs">{product}</Badge>
                                        ))}
                                    </div>
                                </div>
                                
                                {selectedSupplier.notes && (
                                    <div>
                                        <div className="font-medium mb-2">Notes</div>
                                        <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                                            {selectedSupplier.notes}
                                        </p>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
                                    <div>
                                        <div className="font-medium mb-1">Tax ID</div>
                                        <p className="text-muted-foreground">{selectedSupplier.taxId}</p>
                                    </div>
                                    <div>
                                        <div className="font-medium mb-1">Bank Account</div>
                                        <p className="text-muted-foreground">{selectedSupplier.bankAccount}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

SuppliersIndex.layout = withAppShell;
