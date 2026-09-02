import AppLayout, { withAppShell } from '@/layouts/app-layout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';

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

const statusTone: Record<string, { bg: string; text: string; border: string }> = {
    pending: { bg: 'bg-amber-100 dark:bg-amber-950/40', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-900' },
    reserved: { bg: 'bg-blue-100 dark:bg-blue-950/40', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-900' },
    confirmed: { bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-900' },
    completed: { bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-900' },
    cancelled: { bg: 'bg-muted', text: 'text-foreground', border: 'border-border' },
};

export default function EventBookingsIndex() {
    const { bookings, statuses, filters, flash } = usePage<PageProps>().props;

    return (
        <AppLayout breadcrumbs={[{ title: 'Event Bookings', href: '/event-bookings' }]}>
            <Head title="Event Bookings" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/40 px-4 py-2 text-green-800 dark:text-green-300">{flash.success}</div>
                )}

                <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Pipeline</p>
                                <h2 className="text-xl font-semibold text-foreground">Bookings</h2>
                                <p className="text-sm text-muted-foreground">Quick view of requests and their status.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-foreground">Status</label>
                                <select
                                    className="rounded-lg border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                        <table className="min-w-full divide-y divide-border">
                            <thead>
                                <tr className="bg-muted text-left text-xs font-semibold uppercase text-muted-foreground">
                                    <th className="px-3 py-3 md:px-4">Date</th>
                                    <th className="px-3 py-3 md:px-4">Event</th>
                                    <th className="px-3 py-3 md:px-4">Package</th>
                                    <th className="px-3 py-3 md:px-4">Contact</th>
                                    <th className="px-3 py-3 md:px-4">Status</th>
                                    <th className="px-3 py-3 md:px-4">Notes</th>
                                    <th className="px-3 py-3 text-right md:px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {bookings.data.map((booking) => (
                                    <BookingRow key={booking.id} booking={booking} />
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

function BookingRow({ booking }: { booking: EventBooking }) {
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

    const formattedDate = formatDateHuman(booking.event_date);
    const formattedTime = formatTimeHuman(booking.event_start_time);

    return (
        <tr className="align-top">
            <td className="px-3 py-3 text-sm text-foreground md:px-4">
                <div className="font-semibold text-foreground">{formattedDate}</div>
                {formattedTime && <div className="text-xs text-muted-foreground">Start: {formattedTime}</div>}
            </td>
            <td className="px-3 py-3 text-sm text-foreground md:px-4">
                <div className="font-semibold text-foreground">{form.data.event_name}</div>
                {form.data.event_type && <div className="text-xs text-muted-foreground">{form.data.event_type}</div>}
                <div className="text-xs text-muted-foreground">{form.data.venue_address}</div>
            </td>
            <td className="px-3 py-3 text-sm text-foreground md:px-4">
                <div className="font-semibold text-foreground">{booking.package?.name ?? 'Custom'}</div>
                {booking.package?.cup_count ? (
                    <div className="text-xs text-muted-foreground">{booking.package.cup_count} cups</div>
                ) : null}
                {booking.expected_guests ? <div className="text-xs text-muted-foreground">{booking.expected_guests} guests</div> : null}
            </td>
            <td className="px-3 py-3 text-sm text-foreground md:px-4">
                <div className="font-semibold text-foreground">{form.data.contact_name}</div>
                {form.data.contact_email && <div className="text-xs text-muted-foreground">{form.data.contact_email}</div>}
                {form.data.contact_phone && <div className="text-xs text-muted-foreground">{form.data.contact_phone}</div>}
            </td>
            <td className="px-3 py-3 text-sm text-foreground md:px-4">
                <StatusPill status={form.data.status} />
            </td>
            <td className="px-3 py-3 text-sm text-foreground md:px-4">
                <div className="text-foreground">{form.data.notes || '—'}</div>
            </td>
            <td className="px-3 py-3 text-right text-sm text-foreground space-y-2 md:px-4">
                <Link
                    href={`/event-bookings/${booking.id}/edit`}
                    className="block rounded-lg border border-border px-3 py-2 text-center text-sm font-semibold text-foreground hover:bg-muted"
                >
                    Edit
                </Link>
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
                    className={`rounded px-2 py-1 text-sm ${link.active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                />
            ))}
        </div>
    );
}

function StatusPill({ status }: { status: string }) {
    const tone = statusTone[status] || statusTone.pending;
    return (
        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tone.bg} ${tone.text} ${tone.border}`}>
            {status}
        </span>
    );
}

function formatDateHuman(dateStr?: string | null): string {
    if (!dateStr) return '—';

    const tryParse = (value: string) => {
        // If only date is provided, keep as-is; if full ISO, let Date handle it.
        const d = value.includes('T') ? new Date(value) : new Date(value + 'T00:00:00');
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

EventBookingsIndex.layout = withAppShell;
