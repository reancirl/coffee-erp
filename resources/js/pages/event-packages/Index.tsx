import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';

type ProductOption = {
    id: number;
    name: string;
    price?: number | string;
};

type EventPackage = {
    id: number;
    name: string;
    cup_count: number;
    price: string;
    description?: string | null;
    notes?: string | null;
    is_active: boolean;
    products?: ProductOption[];
};

interface PageProps {
    packages: EventPackage[];
    flash?: {
        success?: string;
        error?: string;
    };
}

const currency = (value: number | string) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(Number(value || 0));

export default function EventPackagesIndex() {
    const { packages, flash } = usePage<PageProps>().props;
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const sortedPackages = useMemo(() => [...packages].sort((a, b) => a.cup_count - b.cup_count), [packages]);

    const handleDelete = (pkg: EventPackage) => {
        if (!confirm(`Delete "${pkg.name}"?`)) return;
        setDeletingId(pkg.id);
        router.delete(`/event-packages/${pkg.id}`, {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Event Packages', href: '/event-packages' }]}>
            <Head title="Event Packages" />
            <div className="flex flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-green-800">{flash.success}</div>
                )}

                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm uppercase tracking-wide text-gray-500">Packages</p>
                            <h2 className="text-xl font-semibold text-gray-900">Available options</h2>
                        </div>
                        <Link href="/event-packages/create">
                            <Button size="sm" className="shadow">
                                <Plus className="h-4 w-4" />
                                New package
                            </Button>
                        </Link>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Package</TableHead>
                                    <TableHead className="w-[120px]">Cups</TableHead>
                                    <TableHead className="w-[140px]">Price</TableHead>
                                    <TableHead className="w-[160px]">Public form</TableHead>
                                    <TableHead>Products</TableHead>
                                    <TableHead className="w-[160px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedPackages.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-sm text-gray-600">
                                            No packages yet. Add your first event package.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {sortedPackages.map((pkg) => (
                                    <Fragment key={pkg.id}>
                                        <TableRow>
                                            <TableCell>
                                                <div className="font-semibold text-gray-900">{pkg.name}</div>
                                            </TableCell>
                                            <TableCell className="text-gray-900">{pkg.cup_count} cups</TableCell>
                                            <TableCell className="font-semibold text-gray-900">{currency(pkg.price)}</TableCell>
                                            <TableCell>
                                                {pkg.is_active ? (
                                                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100" variant="secondary">
                                                        Public
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                                                        Hidden
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-700">
                                                {pkg.products?.length ? (
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-primary hover:bg-primary/10 cursor-pointer"
                                                        onClick={() => setExpandedId(expandedId === pkg.id ? null : pkg.id)}
                                                    >
                                                        {expandedId === pkg.id ? (
                                                            <>
                                                                <ChevronUp className="h-4 w-4" />
                                                                Hide products
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ChevronDown className="h-4 w-4" />
                                                                View products ({pkg.products.length})
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-500">No products</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/event-packages/${pkg.id}/edit`}>
                                                        <Button variant="outline" size="sm">
                                                            <Pencil className="h-4 w-4" />
                                                            Edit
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700"
                                                        disabled={deletingId === pkg.id}
                                                        onClick={() => handleDelete(pkg)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        {deletingId === pkg.id ? 'Deleting…' : 'Delete'}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        {expandedId === pkg.id && pkg.products?.length ? (
                                            <TableRow className="bg-gray-50/70">
                                                <TableCell colSpan={6}>
                                                    <div className="flex flex-wrap gap-2">
                                                        {pkg.products.map((product) => (
                                                            <Badge key={product.id} variant="secondary" className="bg-white text-gray-800 shadow-sm">
                                                                {product.name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : null}
                                    </Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
