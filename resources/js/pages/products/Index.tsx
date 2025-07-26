import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, Plus, Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';

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

interface PaginatedProducts {
    data: Product[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url?: string;
        label: string;
        active: boolean;
    }>;
}

interface Props {
    products: PaginatedProducts;
    categories: Category[];
    filters: {
        search?: string;
        category?: string;
        type?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products',
        href: '/products',
    },
];

// Helper function to format currency
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2
    }).format(amount);
};

// Helper function to get price display
const getPriceDisplay = (product: Product): string => {
    if (product.prices?.hot && product.prices?.iced) {
        if (product.prices.hot === product.prices.iced) {
            return formatCurrency(product.prices.hot);
        }
        return `Hot: ${formatCurrency(product.prices.hot)} | Iced: ${formatCurrency(product.prices.iced)}`;
    } else if (product.prices?.hot) {
        return `Hot: ${formatCurrency(product.prices.hot)}`;
    } else if (product.prices?.iced) {
        return `Iced: ${formatCurrency(product.prices.iced)}`;
    }
    return formatCurrency(product.price);
};

export default function Index({ products, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [categoryFilter, setCategoryFilter] = useState(filters.category || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    
    const deleteProduct = (id: number, name: string) => {
        if (confirm(`Are you sure you want to delete "${name}"?`)) {
            router.delete(route('products.destroy', id));
        }
    };
    
    const applyFilters = () => {
        router.get('/products', {
            search: search || undefined,
            category: categoryFilter || undefined,
            type: typeFilter || undefined,
        });
    };
    
    const clearFilters = () => {
        setSearch('');
        setCategoryFilter('');
        setTypeFilter('');
        router.get('/products');
    };
    
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };
    
    // Apply filters when filter values change
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (search !== (filters.search || '')) {
                applyFilters();
            }
        }, 500); // Debounce search
        
        return () => clearTimeout(timeoutId);
    }, [search]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Products</h2>
                    <Link href={route('products.create')}>
                        <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add New Product
                        </Button>
                    </Link>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
                    <form onSubmit={handleSearchSubmit} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Search Products
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    type="text"
                                    placeholder="Search by product name or category..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        
                        <div className="w-48">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category
                            </label>
                            <Select value={categoryFilter} onValueChange={(value) => {
                                setCategoryFilter(value === 'all' ? '' : value);
                                setTimeout(applyFilters, 100);
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id.toString()}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="w-40">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type
                            </label>
                            <Select value={typeFilter} onValueChange={(value) => {
                                setTypeFilter(value === 'all' ? '' : value);
                                setTimeout(applyFilters, 100);
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="product">Products</SelectItem>
                                    <SelectItem value="add-on">Add-ons</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {(search || categoryFilter || typeFilter) && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={clearFilters}
                                className="flex items-center gap-2"
                            >
                                <X className="h-4 w-4" />
                                Clear
                            </Button>
                        )}
                    </form>
                </div>

                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 text-gray-900">
                        {products.data.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500 mb-4">No products found.</p>
                                <Link href={route('products.create')}>
                                    <Button>Create Your First Product</Button>
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Category
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Price
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Type
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Customizations
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {products.data.map((product) => (
                                                <tr key={product.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {product.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {product.category_relation ? (
                                                            <Badge variant="secondary">
                                                                {product.category_relation.name}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-gray-400">No category</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {getPriceDisplay(product)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Badge variant={product.is_add_on ? "outline" : "default"}>
                                                            {product.is_add_on ? 'Add-on' : 'Product'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {product.customizations && product.customizations.length > 0 ? (
                                                            <Badge variant="secondary">
                                                                {product.customizations.length} option{product.customizations.length > 1 ? 's' : ''}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-gray-400">None</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end gap-2">
                                                            <Link href={route('products.edit', product.id)}>
                                                                <Button variant="outline" size="sm">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => deleteProduct(product.id, product.name)}
                                                                className="text-red-600 hover:text-red-700"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {products.last_page > 1 && (
                                    <div className="flex items-center justify-between px-4 py-3 sm:px-6">
                                        <div className="flex flex-1 justify-between sm:hidden">
                                            {products.links[0]?.url && (
                                                <Link
                                                    href={products.links[0].url || '#'}
                                                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                                >
                                                    Previous
                                                </Link>
                                            )}
                                            {products.links[products.links.length - 1]?.url && (
                                                <Link
                                                    href={products.links[products.links.length - 1].url || '#'}
                                                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                                >
                                                    Next
                                                </Link>
                                            )}
                                        </div>
                                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm text-gray-700">
                                                    Showing{' '}
                                                    <span className="font-medium">
                                                        {(products.current_page - 1) * products.per_page + 1}
                                                    </span>{' '}
                                                    to{' '}
                                                    <span className="font-medium">
                                                        {Math.min(products.current_page * products.per_page, products.total)}
                                                    </span>{' '}
                                                    of <span className="font-medium">{products.total}</span> results
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                                                    {products.links.map((link, index) => {
                                                        const isDisabled = !link.url;
                                                        return (
                                                            <Link
                                                                key={index}
                                                                href={link.url || '#'}
                                                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                                                    link.active
                                                                        ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                                                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                                                                } ${
                                                                    index === 0 ? 'rounded-l-md' : ''
                                                                } ${
                                                                    index === products.links.length - 1 ? 'rounded-r-md' : ''
                                                                } ${
                                                                    isDisabled ? 'pointer-events-none opacity-50' : ''
                                                                }`}
                                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                            />
                                                        );
                                                    })}
                                                </nav>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
