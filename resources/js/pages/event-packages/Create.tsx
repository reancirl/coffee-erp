import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { PackageFields, PackageFormPayload, ProductOption, PackageWithProducts } from './PackageFormFields';

interface PageProps {
    products: ProductOption[];
    packages: PackageWithProducts[];
}

export default function EventPackageCreate() {
    const { products, packages } = usePage<PageProps>().props;

    const form = useForm<PackageFormPayload>({
        name: '',
        cup_count: 50,
        price: '',
        description: '',
        notes: '',
        is_active: false,
        product_ids: [],
    });

    return (
        <AppLayout breadcrumbs={[{ title: 'Event Packages', href: '/event-packages' }, { title: 'Create', href: '/event-packages/create' }]}>
            <Head title="Create Event Package" />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-wide text-gray-500">Event packages</p>
                        <h1 className="text-2xl font-semibold text-gray-900">Create package</h1>
                    </div>
                    <Link href="/event-packages">
                        <Button variant="outline">Back to list</Button>
                    </Link>
                </div>

                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.post('/event-packages', {
                                preserveScroll: true,
                            });
                        }}
                        className="space-y-6"
                    >
                        <PackageFields form={form} products={products} productsInModal copyPackages={packages} />
                        <div className="flex justify-end gap-3">
                            <Link href="/event-packages">
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Saving…' : 'Save package'}
                            </Button>
                        </div>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
