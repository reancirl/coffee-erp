import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, ArrowLeft, Package } from 'lucide-react';

interface Category {
    id: number;
    name: string;
    description?: string;
}

interface Product {
    id: number;
    name: string;
    price: number;
    category?: number;
    prices?: {
        hot?: number;
        iced?: number;
    };
    is_add_on: boolean;
    customizations?: Array<{
        name: string;
        options: string[];
        required: boolean;
    }>;
    category_relation?: Category;
    created_at: string;
    updated_at: string;
}

interface Props {
    product: Product;
}

// Helper function to format currency
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2
    }).format(amount);
};

// Helper function to format date
const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export default function Show({ product }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Products',
            href: '/products',
        },
        {
            title: product.name,
            href: `/products/${product.id}`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Product: ${product.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('products.index')}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Products
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            <h2 className="text-2xl font-bold">{product.name}</h2>
                        </div>
                    </div>
                    <Link href={route('products.edit', product.id)}>
                        <Button>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Product
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-medium text-foreground">Product Name</h4>
                                <p className="text-lg">{product.name}</p>
                            </div>

                            <div>
                                <h4 className="font-medium text-foreground">Category</h4>
                                {product.category_relation ? (
                                    <Badge variant="secondary" className="text-sm">
                                        {product.category_relation.name}
                                    </Badge>
                                ) : (
                                    <span className="text-muted-foreground">No category assigned</span>
                                )}
                            </div>

                            <div>
                                <h4 className="font-medium text-foreground">Type</h4>
                                <Badge variant={product.is_add_on ? "outline" : "default"}>
                                    {product.is_add_on ? 'Add-on Item' : 'Regular Product'}
                                </Badge>
                            </div>

                            <div>
                                <h4 className="font-medium text-foreground">Created</h4>
                                <p className="text-sm text-muted-foreground">{formatDate(product.created_at)}</p>
                            </div>

                            <div>
                                <h4 className="font-medium text-foreground">Last Updated</h4>
                                <p className="text-sm text-muted-foreground">{formatDate(product.updated_at)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {product.prices?.hot || product.prices?.iced ? (
                                <div>
                                    <h4 className="font-medium text-foreground mb-3">Variant Pricing</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-4 border rounded-lg">
                                            <h5 className="font-medium text-muted-foreground">Hot</h5>
                                            <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                                                {product.prices.hot ? formatCurrency(product.prices.hot) : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="text-center p-4 border rounded-lg">
                                            <h5 className="font-medium text-muted-foreground">Iced</h5>
                                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                                {product.prices.iced ? formatCurrency(product.prices.iced) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <h4 className="font-medium text-foreground">Base Price</h4>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(product.price)}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Customizations */}
                {product.customizations && product.customizations.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Customization Options</CardTitle>
                            <CardDescription>
                                Available customizations for this product
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {product.customizations.map((customization, index) => (
                                    <div key={index} className="border rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-medium">{customization.name}</h4>
                                            {customization.required && (
                                                <Badge variant="destructive" className="text-xs">
                                                    Required
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            {customization.options.map((option, optionIndex) => (
                                                <div key={optionIndex} className="text-sm text-muted-foreground">
                                                    • {option}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* No Customizations Message */}
                {(!product.customizations || product.customizations.length === 0) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Customization Options</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No customization options available for this product.</p>
                                <Link href={route('products.edit', product.id)}>
                                    <Button variant="outline" className="mt-4">
                                        Add Customizations
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
