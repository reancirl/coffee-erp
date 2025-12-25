import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { PackageFields, PackageFormPayload, ProductOption } from './PackageFormFields';

interface EventPackage {
    id: number;
    name: string;
    cup_count: number;
    price: string;
    description?: string | null;
    notes?: string | null;
    is_active: boolean;
    products?: ProductOption[];
}

interface PageProps {
    eventPackage: EventPackage;
    products: ProductOption[];
}

export default function EventPackageEdit() {
    const { eventPackage, products } = usePage<PageProps>().props;
    const productIds = eventPackage.products?.map((product) => product.id) || [];

    const form = useForm<PackageFormPayload>({
        name: eventPackage.name,
        cup_count: eventPackage.cup_count,
        price: eventPackage.price,
        description: eventPackage.description || '',
        notes: eventPackage.notes || '',
        is_active: eventPackage.is_active && productIds.length > 0,
        product_ids: productIds,
    });

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Event Packages', href: '/event-packages' },
                { title: eventPackage.name, href: `/event-packages/${eventPackage.id}/edit` },
            ]}
        >
            <Head title={`Edit ${eventPackage.name}`} />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-wide text-gray-500">Event packages</p>
                        <h1 className="text-2xl font-semibold text-gray-900">Edit {eventPackage.name}</h1>
                    </div>
                    <Link href="/event-packages">
                        <Button variant="outline">Back to list</Button>
                    </Link>
                </div>

                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.put(`/event-packages/${eventPackage.id}`, {
                                preserveScroll: true,
                            });
                        }}
                        className="space-y-6"
                    >
                        <PackageFields form={form} products={products} productsInModal />
                        <div className="flex justify-end gap-3">
                            <Link href="/event-packages">
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Saving…' : 'Save changes'}
                            </Button>
                        </div>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
