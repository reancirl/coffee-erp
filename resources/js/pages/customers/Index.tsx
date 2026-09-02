import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Plus, Search, X, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Customer {
    id: number;
    known_name: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    loyalty_points_balance: number;
    membership_tier?: string | null;
}

interface PaginatedCustomers {
    data: Customer[];
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
    customers: PaginatedCustomers;
    filters: {
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Customers',
        href: '/customers',
    },
];

export default function Index({ customers, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const deleteCustomer = (id: number, name: string) => {
        if (confirm(`Are you sure you want to delete "${name}"?`)) {
            router.delete(route('customers.destroy', id));
        }
    };

    const applyFilters = () => {
        router.get('/customers', {
            search: search || undefined,
        });
    };

    const clearFilters = () => {
        setSearch('');
        router.get('/customers');
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
            <Head title="Customers" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Customers</h2>
                    <Link href={route('customers.create')}>
                        <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add New Customer
                        </Button>
                    </Link>
                </div>

                {/* Search */}
                <div className="bg-card rounded-lg shadow-sm border p-4">
                    <form onSubmit={handleSearchSubmit} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Search Customers
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    type="text"
                                    placeholder="Search by name, email, or phone..."
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
                        {customers.data.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground mb-4">
                                    {search ? 'No customers found matching your search.' : 'No customers found.'}
                                </p>
                                <Link href={route('customers.create')}>
                                    <Button>Create Your First Customer</Button>
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-border">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Known Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Email
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Phone
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Loyalty Points
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-card divide-y divide-border">
                                            {customers.data.map((customer) => (
                                                <tr key={customer.id} className="hover:bg-muted">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-foreground">
                                                            {customer.known_name}
                                                        </div>
                                                        {customer.membership_tier && (
                                                            <Badge variant="secondary" className="mt-1 capitalize">
                                                                {customer.membership_tier}
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-foreground">
                                                            {customer.first_name} {customer.last_name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-foreground">
                                                            {customer.email || <span className="text-muted-foreground italic">None</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-foreground">
                                                            {customer.phone_number || <span className="text-muted-foreground italic">None</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Badge variant="secondary">
                                                            {customer.loyalty_points_balance}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end gap-2">
                                                            <Link href={route('customers.edit', customer.id)}>
                                                                <Button variant="outline" size="sm">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => deleteCustomer(customer.id, customer.known_name)}
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
                                {customers.last_page > 1 && (
                                    <div className="flex items-center justify-between px-4 py-3 sm:px-6">
                                        <div className="flex flex-1 justify-between sm:hidden">
                                            {customers.links[0]?.url && (
                                                <Link
                                                    href={customers.links[0].url || '#'}
                                                    className="relative inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                                >
                                                    Previous
                                                </Link>
                                            )}
                                            {customers.links[customers.links.length - 1]?.url && (
                                                <Link
                                                    href={customers.links[customers.links.length - 1].url || '#'}
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
                                                        {(customers.current_page - 1) * customers.per_page + 1}
                                                    </span>{' '}
                                                    to{' '}
                                                    <span className="font-medium">
                                                        {Math.min(customers.current_page * customers.per_page, customers.total)}
                                                    </span>{' '}
                                                    of <span className="font-medium">{customers.total}</span> results
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                                                    {customers.links.map((link, index) => {
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
                                                                    index === customers.links.length - 1 ? 'rounded-r-md' : ''
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
