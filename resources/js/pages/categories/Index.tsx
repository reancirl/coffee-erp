import { Head, Link, router } from '@inertiajs/react';
import AppLayout, { withAppShell } from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Plus, Search, X, Package } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Category {
    id: number;
    name: string;
    description?: string;
    products_count: number;
    created_at: string;
    updated_at: string;
}

interface PaginatedCategories {
    data: Category[];
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
    categories: PaginatedCategories;
    filters: {
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Categories',
        href: '/categories',
    },
];

// Helper function to format date
const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export default function Index({ categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    
    const deleteCategory = (id: number, name: string) => {
        if (confirm(`Are you sure you want to delete "${name}"?`)) {
            router.delete(route('categories.destroy', id));
        }
    };
    
    const applyFilters = () => {
        router.get('/categories', {
            search: search || undefined,
        });
    };
    
    const clearFilters = () => {
        setSearch('');
        router.get('/categories');
    };
    
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };
    
    // Apply filters when search value changes (debounced)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (search !== (filters.search || '')) {
                applyFilters();
            }
        }, 500);
        
        return () => clearTimeout(timeoutId);
    }, [search]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Categories" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Categories</h2>
                    <Link href={route('categories.create')}>
                        <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add New Category
                        </Button>
                    </Link>
                </div>

                {/* Search */}
                <div className="bg-card rounded-lg shadow-sm border p-4">
                    <form onSubmit={handleSearchSubmit} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Search Categories
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    type="text"
                                    placeholder="Search by category name or description..."
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
                        {categories.data.length === 0 ? (
                            <div className="text-center py-8">
                                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground mb-4">
                                    {search ? 'No categories found matching your search.' : 'No categories found.'}
                                </p>
                                <Link href={route('categories.create')}>
                                    <Button>Create Your First Category</Button>
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
                                                    Description
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Products
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Created
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-card divide-y divide-border">
                                            {categories.data.map((category) => (
                                                <tr key={category.id} className="hover:bg-muted">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-foreground">
                                                            {category.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-foreground max-w-xs truncate">
                                                            {category.description || (
                                                                <span className="text-muted-foreground italic">No description</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                                            <Package className="h-3 w-3" />
                                                            {category.products_count} product{category.products_count !== 1 ? 's' : ''}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-muted-foreground">
                                                            {formatDate(category.created_at)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end gap-2">
                                                            <Link href={route('categories.show', category.id)}>
                                                                <Button variant="outline" size="sm">
                                                                    View
                                                                </Button>
                                                            </Link>
                                                            <Link href={route('categories.edit', category.id)}>
                                                                <Button variant="outline" size="sm">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => deleteCategory(category.id, category.name)}
                                                                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                                                                disabled={category.products_count > 0}
                                                                title={category.products_count > 0 ? 'Cannot delete category with products' : 'Delete category'}
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
                                {categories.last_page > 1 && (
                                    <div className="flex items-center justify-between px-4 py-3 sm:px-6">
                                        <div className="flex flex-1 justify-between sm:hidden">
                                            {categories.links[0]?.url && (
                                                <Link
                                                    href={categories.links[0].url || '#'}
                                                    className="relative inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                                >
                                                    Previous
                                                </Link>
                                            )}
                                            {categories.links[categories.links.length - 1]?.url && (
                                                <Link
                                                    href={categories.links[categories.links.length - 1].url || '#'}
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
                                                        {(categories.current_page - 1) * categories.per_page + 1}
                                                    </span>{' '}
                                                    to{' '}
                                                    <span className="font-medium">
                                                        {Math.min(categories.current_page * categories.per_page, categories.total)}
                                                    </span>{' '}
                                                    of <span className="font-medium">{categories.total}</span> results
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                                                    {categories.links.map((link, index) => {
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
                                                                    index === categories.links.length - 1 ? 'rounded-r-md' : ''
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
