import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useMemo } from 'react';

type EventPackage = {
    id: number;
    name: string;
    cup_count: number;
    price: string;
};

type EventBooking = {
    id: number;
    event_package_id?: number | null;
    package?: EventPackage | null;
    event_date: string;
    event_start_time?: string | null;
    duration_minutes?: number | null;
    event_name: string;
    event_type?: string | null;
    venue_address: string;
    contact_name: string;
    contact_email?: string | null;
    contact_phone?: string | null;
    expected_guests?: number | null;
    status: string;
    notes?: string | null;
    created_at: string;
};

interface Paginated<T> {
    data: T[];
    meta?: {
        current_page: number;
        last_page: number;
        links?: { url: string | null; label: string; active: boolean }[];
    };
    links?: { url: string | null; label: string; active: boolean }[];
}

interface PageProps {
    bookings: Paginated<EventBooking>;
    packages: EventPackage[];
    statuses: string[];
    filters: {
        status?: string | null;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

const currency = (value: number | string) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(Number(value || 0));

export default function EventBookingsIndex() {
    const { bookings, packages, statuses, filters, flash } = usePage<PageProps>().props;

    const filteredPackages = useMemo(() => [...packages].sort((a, b) => a.cup_count - b.cup_count), [packages]);

    return (
        <AppLayout breadcrumbs={[{ title: 'Event Bookings', href: '/event-bookings' }]}>
            <Head title="Event Bookings" />
            <div className="flex flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-green-800">{flash.success}</div>
                )}

                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="text-sm uppercase tracking-wide text-gray-500">Pipeline</p>
                                <h2 className="text-xl font-semibold text-gray-900">Bookings</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">Status</label>
                                <select
                                    className="rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    value={filters.status || ''}
                                    onChange={(e) => {
                                        router.get('/event-bookings', { status: e.target.value || undefined }, { preserveScroll: true });
                                    }}
                                >
                                    <option value="">All</option>
                                    {statuses.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <Link
                            href="/event-bookings/create"
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
                        >
                            New booking
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Event</th>
                                    <th className="px-4 py-3">Package</th>
                                    <th className="px-4 py-3">Contact</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Notes</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {bookings.data.map((booking) => (
                                    <BookingRow key={booking.id} booking={booking} packages={packages} statuses={statuses} />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <PaginationLinks bookings={bookings} />
                </section>
            </div>
        </AppLayout>
    );
}

function BookingRow({ booking, packages, statuses }: { booking: EventBooking; packages: EventPackage[]; statuses: string[] }) {
    const form = useForm({
        event_package_id: booking.event_package_id ?? '',
        event_date: booking.event_date,
        event_start_time: booking.event_start_time ?? '',
        duration_minutes: booking.duration_minutes ?? '',
        event_name: booking.event_name,
        event_type: booking.event_type ?? '',
        venue_address: booking.venue_address,
        contact_name: booking.contact_name,
        contact_email: booking.contact_email ?? '',
        contact_phone: booking.contact_phone ?? '',
        expected_guests: booking.expected_guests ?? '',
        status: booking.status,
        notes: booking.notes ?? '',
    });

    const save = () =>
        form.patch(`/event-bookings/${booking.id}`, {
            preserveScroll: true,
        });

    const formattedDate = formatDateHuman(booking.event_date);
    const formattedTime = formatTimeHuman(booking.event_start_time);

    return (
        <tr className="align-top">
            <td className="px-4 py-3 text-sm text-gray-800">
                <div className="font-semibold text-gray-900">{formattedDate}</div>
                {formattedTime && <div className="text-xs text-gray-600">Start: {formattedTime}</div>}
            </td>
            <td className="px-4 py-3 text-sm text-gray-800">
                <div className="font-semibold text-gray-900">{form.data.event_name}</div>
                {form.data.event_type && <div className="text-xs text-gray-600">{form.data.event_type}</div>}
                <div className="text-xs text-gray-600">{form.data.venue_address}</div>
            </td>
            <td className="px-4 py-3 text-sm text-gray-800">
                <select
                    className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={form.data.event_package_id}
                    onChange={(e) => form.setData('event_package_id', e.target.value)}
                >
                    <option value="">Custom</option>
                    {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                            {pkg.name} · {pkg.cup_count} cups · {currency(pkg.price)}
                        </option>
                    ))}
                </select>
                {form.data.expected_guests ? <div className="text-xs text-gray-600 mt-1">{form.data.expected_guests} guests</div> : null}
            </td>
            <td className="px-4 py-3 text-sm text-gray-800">
                <div className="font-semibold text-gray-900">{form.data.contact_name}</div>
                {form.data.contact_email && <div className="text-xs text-gray-600">{form.data.contact_email}</div>}
                {form.data.contact_phone && <div className="text-xs text-gray-600">{form.data.contact_phone}</div>}
            </td>
            <td className="px-4 py-3 text-sm text-gray-800">
                <select
                    className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={form.data.status}
                    onChange={(e) => form.setData('status', e.target.value)}
                >
                    {statuses.map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </select>
            </td>
            <td className="px-4 py-3 text-sm text-gray-800">
                <textarea
                    className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={form.data.notes}
                    onChange={(e) => form.setData('notes', e.target.value)}
                    rows={3}
                />
            </td>
            <td className="px-4 py-3 text-right text-sm text-gray-800">
                <button
                    type="button"
                    onClick={save}
                    disabled={form.processing}
                    className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {form.processing ? 'Saving…' : 'Save'}
                </button>
            </td>
        </tr>
    );
}

function PaginationLinks({ bookings }: { bookings: Paginated<EventBooking> }) {
    const links = bookings.meta?.links ?? bookings.links ?? [];

    if (!links.length) {
        return null;
    }

    return (
        <div className="mt-4 flex items-center gap-2">
            {links.map((link, idx) => (
                <Link
                    key={idx}
                    href={link.url || '#'}
                    className={`rounded px-2 py-1 text-sm ${link.active ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'}`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                />
            ))}
        </div>
    );
}

function formatDateHuman(dateStr?: string | null): string {
    if (!dateStr) return '—';

    const tryParse = (value: string) => {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    };

    let date: Date | null = null;

    // If full ISO string like 2025-12-24T00:00:00.000000Z
    date = tryParse(dateStr);

    // If still not parsed, try stripping after "T"
    if (!date && dateStr.includes('T')) {
        date = tryParse(dateStr.split('T')[0]);
    }

    // If still not parsed, try date-only with fixed time
    if (!date) {
        date = tryParse(dateStr + 'T00:00:00');
    }

    if (!date) return dateStr;

    return date.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatTimeHuman(timeStr?: string | null): string | null {
    if (!timeStr) return null;
    const parts = timeStr.split(':').map(Number);
    if (parts.some((p) => Number.isNaN(p))) {
        return timeStr;
    }
    const [h = 0, m = 0] = parts;
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
    });
}
