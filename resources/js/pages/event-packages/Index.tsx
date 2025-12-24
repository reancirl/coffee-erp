import AppLayout from '@/layouts/app-layout';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type EventPackage = {
    id: number;
    name: string;
    cup_count: number;
    price: string;
    description?: string | null;
    notes?: string | null;
    is_active: boolean;
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
    const [showCreate, setShowCreate] = useState(false);

    const createForm = useForm({
        name: '',
        cup_count: 50,
        price: '',
        description: '',
        notes: '',
        is_active: true,
    });

    const groupedPackages = useMemo(() => [...packages].sort((a, b) => a.cup_count - b.cup_count), [packages]);

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
                        <Dialog open={showCreate} onOpenChange={setShowCreate}>
                            <DialogTrigger asChild>
                                <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90">
                                    New package
                                </button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create package</DialogTitle>
                                    <DialogDescription>Define the cup count, price, and details for this cart option.</DialogDescription>
                                </DialogHeader>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        createForm.post('/event-packages', {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                createForm.reset('name', 'price', 'description', 'notes');
                                                setShowCreate(false);
                                            },
                                        });
                                    }}
                                    className="grid grid-cols-1 gap-4 md:grid-cols-2"
                                >
                                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                                        Package name
                                        <input
                                            className="rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            value={createForm.data.name}
                                            onChange={(e) => createForm.setData('name', e.target.value)}
                                            placeholder="50 Cup Cart"
                                            required
                                        />
                                    </label>

                                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                                        Cup count
                                        <input
                                            type="number"
                                            min={1}
                                            className="rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            value={createForm.data.cup_count}
                                            onChange={(e) => createForm.setData('cup_count', Number(e.target.value))}
                                        />
                                    </label>

                                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                                        Price
                                        <input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            className="rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            value={createForm.data.price}
                                            onChange={(e) => createForm.setData('price', e.target.value)}
                                            placeholder="0.00"
                                            required
                                        />
                                    </label>

                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            checked={createForm.data.is_active}
                                            onChange={(e) => createForm.setData('is_active', e.target.checked)}
                                        />
                                        Make this package available on the public stepper
                                    </label>

                                    <label className="md:col-span-2 flex flex-col gap-1 text-sm font-medium text-gray-700">
                                        Description
                                        <textarea
                                            className="rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            value={createForm.data.description}
                                            onChange={(e) => createForm.setData('description', e.target.value)}
                                            placeholder="What the package includes (beans, milk options, flavors, barista hours)"
                                            rows={3}
                                        />
                                    </label>

                                    <label className="md:col-span-2 flex flex-col gap-1 text-sm font-medium text-gray-700">
                                        Internal notes
                                        <textarea
                                            className="rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            value={createForm.data.notes}
                                            onChange={(e) => createForm.setData('notes', e.target.value)}
                                            placeholder="Any internal reminders"
                                            rows={2}
                                        />
                                    </label>

                                    <DialogFooter className="md:col-span-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowCreate(false)}
                                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={createForm.processing}
                                            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground shadow hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {createForm.processing ? 'Saving…' : 'Save package'}
                                        </button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {groupedPackages.map((pkg) => (
                            <PackageCard key={pkg.id} pkg={pkg} />
                        ))}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}

function PackageCard({ pkg }: { pkg: EventPackage }) {
    const form = useForm({
        name: pkg.name,
        cup_count: pkg.cup_count,
        price: pkg.price,
        description: pkg.description || '',
        notes: pkg.notes || '',
        is_active: pkg.is_active,
    });

    const save = () =>
        form.put(`/event-packages/${pkg.id}`, {
            preserveScroll: true,
        });

    const destroy = () =>
        form.delete(`/event-packages/${pkg.id}`, {
            preserveScroll: true,
        });

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs uppercase text-primary">Coffee cart</p>
                    <h3 className="text-lg font-semibold text-gray-900">{form.data.name}</h3>
                    <p className="text-sm text-gray-600">{form.data.cup_count} cups</p>
                </div>
                <div className="text-right text-lg font-bold text-gray-900">{currency(form.data.price)}</div>
            </div>

            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Name
                <input
                    className="rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                />
            </label>

            <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Cups
                    <input
                        type="number"
                        min={1}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={form.data.cup_count}
                        onChange={(e) => form.setData('cup_count', Number(e.target.value))}
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Price
                    <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={form.data.price}
                        onChange={(e) => form.setData('price', e.target.value)}
                    />
                </label>
            </div>

            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Description
                <textarea
                    className="rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={form.data.description}
                    onChange={(e) => form.setData('description', e.target.value)}
                    rows={2}
                />
            </label>

            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={form.data.is_active}
                    onChange={(e) => form.setData('is_active', e.target.checked)}
                />
                Active on public form
            </label>

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={save}
                    disabled={form.processing}
                    className="flex-1 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {form.processing ? 'Saving…' : 'Save'}
                </button>
                <button
                    type="button"
                    onClick={destroy}
                    disabled={form.processing}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:border-red-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}
