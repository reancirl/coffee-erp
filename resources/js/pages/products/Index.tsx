import { Head, Link, router } from '@inertiajs/react';
import AppLayout, { withAppShell } from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Plus, Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Category {
    id: number;
    name: string;
    description?: string;
    allowance_eligible?: boolean;
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
    allowance_eligible?: boolean | null;
    customizations?: Array<{
        name: string;
        options: string[];
        required: boolean;
    }>;
    category_relation?: Category;
    created_at: string;
    updated_at: string;
}

/**
 * Display only. The order endpoint is the authority; this mirrors its rule so
 * the list can show which products the allowance will refuse.
 */
const onAllowance = (product: Product): boolean =>
    product.allowance_eligible ?? product.category_relation?.allowance_eligible ?? true;

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

export default function Index({ products, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    
    const deleteProduct = (id: number, name: string) => {
        if (confirm(`Are you sure you want to delete "${name}"?`)) {
            router.delete(route('products.destroy', id));
        }
    };
    
    const applyFilters = () => {
        router.get('/products', {
            search: search || undefined,
        });
    };
    
    const clearFilters = () => {
        setSearch('');
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
                <div className="bg-card rounded-lg shadow-sm border p-4 space-y-4">
                    <form onSubmit={handleSearchSubmit} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Search Products
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    type="text"
                                    placeholder="Search by product name or category..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        
                        {search && (
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

                <div className="bg-card overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 text-foreground">
                        {products.data.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground mb-4">No products found.</p>
                                <Link href={route('products.create')}>
                                    <Button>Create Your First Product</Button>
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-border">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Category
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Price
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Type
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Customizations
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-card divide-y divide-border">
                                            {products.data.map((product) => (
                                                <tr key={product.id} className="hover:bg-muted">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-foreground">
                                                            {product.name}
                                                        </div>
                                                        {!onAllowance(product) && (
                                                            <div className="text-xs text-amber-700 dark:text-amber-300">
                                                                Not on allowance
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {product.category_relation ? (
                                                            <Badge variant="secondary">
                                                                {product.category_relation.name}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground">No category</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-foreground">
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
                                                            <span className="text-muted-foreground">None</span>
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
                                                                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
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
                                                    className="relative inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                                >
                                                    Previous
                                                </Link>
                                            )}
                                            {products.links[products.links.length - 1]?.url && (
                                                <Link
                                                    href={products.links[products.links.length - 1].url || '#'}
                                                    className="relative ml-3 inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                                >
                                                    Next
                                                </Link>
                                            )}
                                        </div>
                                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm text-foreground">
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
                                                                        : 'text-foreground ring-1 ring-inset ring-ring hover:bg-muted focus:outline-offset-0'
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

Index.layout = withAppShell;
