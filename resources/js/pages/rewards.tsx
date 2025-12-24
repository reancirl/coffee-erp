import { Head, usePage } from '@inertiajs/react';
import { PublicFooter } from '@/components/public-footer';
import { PublicHeader } from '@/components/public-header';

type PageProps = {
    auth?: { user?: unknown };
};

export default function Rewards() {
    const { auth } = usePage<PageProps>().props;
    const isLoggedIn = Boolean(auth?.user);

    return (
        <>
            <Head title="Rewards" />
            <div className="min-h-screen bg-white">
                <PublicHeader isLoggedIn={isLoggedIn} />

                <main className="mx-auto flex max-w-4xl flex-col items-center justify-center px-4 py-16 text-center">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-8 py-12 shadow-sm">
                        <p className="text-sm uppercase tracking-[0.25em] text-gray-500">Rewards</p>
                        <h1 className="mt-3 text-3xl font-bold text-gray-900">Coming soon</h1>
                        <p className="mt-3 text-base text-gray-700">
                            Our rewards program is brewing. Check back soon for perks, points, and member-only drops.
                        </p>
                    </div>
                </main>

                <PublicFooter />
            </div>
        </>
    );
}
