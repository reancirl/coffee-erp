import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, ArrowLeft, Package, Calendar } from 'lucide-react';

interface Product {
    id: number;
    name: string;
    price: number;
    is_add_on: boolean;
}

interface Category {
    id: number;
    name: string;
    description?: string;
    products_count: number;
    products: Product[];
    created_at: string;
    updated_at: string;
}

interface Props {
    category: Category;
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

export default function Show({ category }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Categories',
            href: '/categories',
        },
        {
            title: category.name,
            href: `/categories/${category.id}`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Category: ${category.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('categories.index')}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Categories
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <Package className="h-8 w-8 text-blue-600" />
                            <h2 className="text-2xl font-bold">{category.name}</h2>
                        </div>
                    </div>
                    <Link href={route('categories.edit', category.id)}>
                        <Button>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Category
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Category Information */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Category Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-medium text-gray-700">Name</h4>
                                    <p className="text-lg">{category.name}</p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-700">Description</h4>
                                    {category.description ? (
                                        <p className="text-gray-600">{category.description}</p>
                                    ) : (
                                        <span className="text-gray-400 italic">No description provided</span>
                                    )}
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-700">Total Products</h4>
                                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                        <Package className="h-3 w-3" />
                                        {category.products_count} product{category.products_count !== 1 ? 's' : ''}
                                    </Badge>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-700">Created</h4>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="h-4 w-4" />
                                        {formatDate(category.created_at)}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-700">Last Updated</h4>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="h-4 w-4" />
                                        {formatDate(category.updated_at)}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Products in Category */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Products in this Category</CardTitle>
                                <CardDescription>
                                    {category.products_count > 0 
                                        ? `Showing ${Math.min(category.products.length, 10)} of ${category.products_count} products`
                                        : 'No products in this category yet'
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {category.products.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                        <p className="text-gray-500 mb-4">No products in this category yet.</p>
                                        <Link href={route('products.create')}>
                                            <Button>Add First Product</Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {category.products.map((product) => (
                                            <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <Package className="h-5 w-5 text-gray-400" />
                                                    <div>
                                                        <h4 className="font-medium">{product.name}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-sm text-gray-600">
                                                                {formatCurrency(product.price)}
                                                            </span>
                                                            {product.is_add_on && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    Add-on
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Link href={route('products.show', product.id)}>
                                                        <Button variant="outline" size="sm">
                                                            View
                                                        </Button>
                                                    </Link>
                                                    <Link href={route('products.edit', product.id)}>
                                                        <Button variant="outline" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {category.products_count > category.products.length && (
                                            <div className="text-center pt-4">
                                                <Link href={route('products.index', { category: category.id })}>
                                                    <Button variant="outline">
                                                        View All {category.products_count} Products
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
