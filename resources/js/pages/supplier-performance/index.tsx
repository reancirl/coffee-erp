import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Search, Download, Star, Clock, CheckCircle, XCircle, AlertTriangle, Calendar, DollarSign, Package, Eye } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Supplier Performance',
        href: '/supplier-performance',
    },
];

// Mock performance data
const mockPerformanceData = [
    {
        id: 1,
        supplier: 'Coffee Beans Co.',
        category: 'Coffee & Beverages',
        totalOrders: 45,
        onTimeDeliveries: 42,
        qualityScore: 4.8,
        avgLeadTime: 5.2,
        orderAccuracy: 96.5,
        totalSpent: 125000.00,
        lastOrderDate: '2025-01-02',
        issues: 2,
        performance: 'excellent',
        trends: {
            onTime: [95, 92, 98, 94, 93],
            quality: [4.7, 4.8, 4.6, 4.9, 4.8],
            leadTime: [5.5, 5.0, 5.2, 5.1, 5.2]
        }
    },
    {
        id: 2,
        supplier: 'Dairy Fresh Ltd.',
        category: 'Dairy Products',
        totalOrders: 78,
        onTimeDeliveries: 74,
        qualityScore: 4.5,
        avgLeadTime: 2.1,
        orderAccuracy: 98.2,
        totalSpent: 89500.00,
        lastOrderDate: '2025-01-03',
        issues: 1,
        performance: 'good',
        trends: {
            onTime: [92, 95, 94, 96, 95],
            quality: [4.4, 4.5, 4.6, 4.4, 4.5],
            leadTime: [2.2, 2.0, 2.1, 2.0, 2.1]
        }
    },
    {
        id: 3,
        supplier: 'Sweet Syrups Inc.',
        category: 'Syrups & Flavoring',
        totalOrders: 23,
        onTimeDeliveries: 18,
        qualityScore: 4.2,
        avgLeadTime: 7.8,
        orderAccuracy: 87.5,
        totalSpent: 45000.00,
        lastOrderDate: '2024-12-28',
        issues: 5,
        performance: 'needs_improvement',
        trends: {
            onTime: [85, 78, 82, 75, 78],
            quality: [4.3, 4.1, 4.2, 4.0, 4.2],
            leadTime: [7.0, 8.2, 7.5, 8.0, 7.8]
        }
    },
    {
        id: 4,
        supplier: 'Paper & Packaging Co.',
        category: 'Packaging & Supplies',
        totalOrders: 12,
        onTimeDeliveries: 8,
        qualityScore: 3.8,
        avgLeadTime: 4.5,
        orderAccuracy: 75.0,
        totalSpent: 25000.00,
        lastOrderDate: '2024-11-15',
        issues: 8,
        performance: 'poor',
        trends: {
            onTime: [70, 65, 68, 60, 67],
            quality: [4.0, 3.8, 3.7, 3.6, 3.8],
            leadTime: [4.0, 4.8, 4.2, 4.7, 4.5]
        }
    }
];

const getPerformanceBadge = (performance: string) => {
    switch (performance) {
        case 'excellent':
            return <Badge variant="default" className="bg-green-100 text-green-800 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />Excellent
            </Badge>;
        case 'good':
            return <Badge variant="default" className="bg-blue-100 text-blue-800 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />Good
            </Badge>;
        case 'needs_improvement':
            return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />Needs Improvement
            </Badge>;
        case 'poor':
            return <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="w-3 h-3" />Poor
            </Badge>;
        default:
            return <Badge variant="outline">{performance}</Badge>;
    }
};

const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
        <Star
            key={i}
            className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
    ));
};

export default function SupplierPerformanceIndex() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPerformance, setSelectedPerformance] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

    const performances = ['all', 'excellent', 'good', 'needs_improvement', 'poor'];
    const categories = ['all', 'Coffee & Beverages', 'Dairy Products', 'Syrups & Flavoring', 'Packaging & Supplies'];

    const filteredData = mockPerformanceData.filter(supplier => {
        const matchesSearch = supplier.supplier.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPerformance = selectedPerformance === 'all' || supplier.performance === selectedPerformance;
        const matchesCategory = selectedCategory === 'all' || supplier.category === selectedCategory;
        
        return matchesSearch && matchesPerformance && matchesCategory;
    });

    const avgOnTimeRate = mockPerformanceData.reduce((sum, s) => sum + (s.onTimeDeliveries / s.totalOrders * 100), 0) / mockPerformanceData.length;
    const avgQualityScore = mockPerformanceData.reduce((sum, s) => sum + s.qualityScore, 0) / mockPerformanceData.length;
    const avgLeadTime = mockPerformanceData.reduce((sum, s) => sum + s.avgLeadTime, 0) / mockPerformanceData.length;
    const totalIssues = mockPerformanceData.reduce((sum, s) => sum + s.issues, 0);

    const handleViewSupplier = (supplier: any) => {
        setSelectedSupplier(supplier);
        setIsViewModalOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Supplier Performance" />
            
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Supplier Performance</h1>
                        <p className="text-muted-foreground">
                            Track and analyze supplier performance metrics
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Export Report
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg On-Time Rate</CardTitle>
                            <Clock className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{avgOnTimeRate.toFixed(1)}%</div>
                            <Progress value={avgOnTimeRate} className="mt-2" />
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
                            <Star className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{avgQualityScore.toFixed(1)}</div>
                            <div className="flex items-center gap-1 mt-1">
                                {getRatingStars(avgQualityScore)}
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Lead Time</CardTitle>
                            <Calendar className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{avgLeadTime.toFixed(1)}</div>
                            <p className="text-xs text-muted-foreground">
                                days average
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{totalIssues}</div>
                            <p className="text-xs text-muted-foreground">
                                across all suppliers
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
                            <Select value={selectedPerformance} onValueChange={setSelectedPerformance}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Performance" />
                                </SelectTrigger>
                                <SelectContent>
                                    {performances.map(performance => (
                                        <SelectItem key={performance} value={performance}>
                                            {performance === 'all' ? 'All Performance' : 
                                             performance.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Performance Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Supplier Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>Performance</TableHead>
                                        <TableHead>On-Time Rate</TableHead>
                                        <TableHead>Quality Score</TableHead>
                                        <TableHead>Avg Lead Time</TableHead>
                                        <TableHead>Order Accuracy</TableHead>
                                        <TableHead>Issues</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.map((supplier) => (
                                        <TableRow key={supplier.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{supplier.supplier}</div>
                                                    <div className="text-sm text-muted-foreground">{supplier.category}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getPerformanceBadge(supplier.performance)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span>{((supplier.onTimeDeliveries / supplier.totalOrders) * 100).toFixed(1)}%</span>
                                                    <Progress 
                                                        value={(supplier.onTimeDeliveries / supplier.totalOrders) * 100} 
                                                        className="w-16 h-2"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {getRatingStars(supplier.qualityScore)}
                                                    <span className="ml-1">{supplier.qualityScore}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{supplier.avgLeadTime} days</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span>{supplier.orderAccuracy}%</span>
                                                    <Progress 
                                                        value={supplier.orderAccuracy} 
                                                        className="w-16 h-2"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {supplier.issues > 0 ? (
                                                    <Badge variant="destructive">{supplier.issues}</Badge>
                                                ) : (
                                                    <Badge variant="default" className="bg-green-100 text-green-800">0</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewSupplier(supplier)}
                                                    className="flex items-center gap-1"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* View Supplier Performance Modal */}
                <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                    <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Performance Details - {selectedSupplier?.supplier}</DialogTitle>
                        </DialogHeader>
                        {selectedSupplier && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold">{selectedSupplier.supplier}</h3>
                                        <p className="text-muted-foreground">{selectedSupplier.category}</p>
                                    </div>
                                    {getPerformanceBadge(selectedSupplier.performance)}
                                </div>
                                
                                {/* Key Metrics */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-blue-600">
                                                    {((selectedSupplier.onTimeDeliveries / selectedSupplier.totalOrders) * 100).toFixed(1)}%
                                                </div>
                                                <div className="text-sm text-muted-foreground">On-Time Rate</div>
                                                <Progress 
                                                    value={(selectedSupplier.onTimeDeliveries / selectedSupplier.totalOrders) * 100} 
                                                    className="mt-2"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-yellow-600">
                                                    {selectedSupplier.qualityScore}
                                                </div>
                                                <div className="text-sm text-muted-foreground">Quality Score</div>
                                                <div className="flex justify-center gap-1 mt-2">
                                                    {getRatingStars(selectedSupplier.qualityScore)}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-green-600">
                                                    {selectedSupplier.avgLeadTime}
                                                </div>
                                                <div className="text-sm text-muted-foreground">Avg Lead Time (days)</div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-purple-600">
                                                    {selectedSupplier.orderAccuracy}%
                                                </div>
                                                <div className="text-sm text-muted-foreground">Order Accuracy</div>
                                                <Progress 
                                                    value={selectedSupplier.orderAccuracy} 
                                                    className="mt-2"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                                
                                {/* Order Statistics */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <div className="font-medium mb-1">Total Orders</div>
                                        <p className="text-muted-foreground">{selectedSupplier.totalOrders}</p>
                                    </div>
                                    <div>
                                        <div className="font-medium mb-1">Total Spent</div>
                                        <p className="text-muted-foreground">₱{selectedSupplier.totalSpent.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <div className="font-medium mb-1">Last Order</div>
                                        <p className="text-muted-foreground">
                                            {new Date(selectedSupplier.lastOrderDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <div className="font-medium mb-1">Issues Reported</div>
                                        <p className="text-muted-foreground">
                                            {selectedSupplier.issues > 0 ? (
                                                <span className="text-red-600">{selectedSupplier.issues}</span>
                                            ) : (
                                                <span className="text-green-600">0</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Performance Trends */}
                                <div>
                                    <h4 className="font-medium mb-3">Performance Trends (Last 5 Orders)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm">On-Time Delivery %</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-end gap-1 h-16">
                                                    {selectedSupplier.trends.onTime.map((value: number, index: number) => (
                                                        <div
                                                            key={index}
                                                            className="bg-blue-500 rounded-t flex-1"
                                                            style={{ height: `${(value / 100) * 100}%` }}
                                                            title={`${value}%`}
                                                        />
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm">Quality Score</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-end gap-1 h-16">
                                                    {selectedSupplier.trends.quality.map((value: number, index: number) => (
                                                        <div
                                                            key={index}
                                                            className="bg-yellow-500 rounded-t flex-1"
                                                            style={{ height: `${(value / 5) * 100}%` }}
                                                            title={`${value}/5`}
                                                        />
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm">Lead Time (days)</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-end gap-1 h-16">
                                                    {selectedSupplier.trends.leadTime.map((value: number, index: number) => (
                                                        <div
                                                            key={index}
                                                            className="bg-green-500 rounded-t flex-1"
                                                            style={{ height: `${(value / 10) * 100}%` }}
                                                            title={`${value} days`}
                                                        />
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
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
