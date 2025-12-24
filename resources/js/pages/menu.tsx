import { Head, usePage } from '@inertiajs/react';
import { PublicFooter } from '@/components/public-footer';
import { PublicHeader } from '@/components/public-header';

type Product = {
    id: number;
    name: string;
    price?: number | null;
    prices?: Record<string, number | null> | null;
    is_add_on?: boolean;
};

type Category = {
    id: number;
    name: string;
    description?: string | null;
    products: Product[];
};

type PageProps = {
    categories: Category[];
    auth?: { user?: unknown };
};

const formatPrice = (product: Product) => {
    const basePrice =
        product.price ??
        product.prices?.hot ??
        product.prices?.iced ??
        null;

    if (basePrice !== null) {
        return `₱${Number(basePrice).toLocaleString()}`;
    }

    return 'See barista';
};

export default function Menu() {
    const { categories, auth } = usePage<PageProps>().props;
    const isLoggedIn = Boolean(auth?.user);

    return (
        <>
            <Head title="Menu" />
            <div className="min-h-screen bg-white">
                <PublicHeader isLoggedIn={isLoggedIn} />

                <main className="mx-auto max-w-6xl px-4 py-12">
                    <div className="mb-10 text-center">
                        <p className="text-sm uppercase tracking-[0.25em] text-gray-500">Eastlone Menu</p>
                        <h1 className="mt-3 text-4xl font-bold text-gray-900">Crafted drinks for your day.</h1>
                        <p className="mt-3 text-base text-gray-600">
                            From house espresso to blended signatures, browse our current offerings. Prices may vary for events.
                        </p>
                    </div>

                    <div className="space-y-10">
                        {categories.map((category) => (
                            <section key={category.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
                                <div className="mb-4 flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>
                                        {category.description && (
                                            <p className="text-sm text-gray-600">{category.description}</p>
                                        )}
                                    </div>
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase text-gray-500">
                                        {category.products.length} items
                                    </span>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {category.products.map((product) => (
                                        <div
                                            key={product.id}
                                            className="rounded-xl border border-white bg-white/60 p-4 shadow-sm"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-base font-semibold text-gray-900">{product.name}</p>
                                                    {product.is_add_on && (
                                                        <p className="text-xs uppercase text-primary">Add-on</p>
                                                    )}
                                                </div>
                                                <p className="text-sm font-semibold text-gray-900">{formatPrice(product)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                </main>

                <PublicFooter />
            </div>
        </>
    );
}
