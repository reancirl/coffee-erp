import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

type EventPackage = {
    id: number;
    name: string;
    cup_count: number;
    price: string;
};

type EventBooking = {
    id: number;
    event_package_id?: number | null;
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
};

type PageProps = {
    booking: EventBooking;
    packages: EventPackage[];
    statuses: string[];
};

export default function EditBooking() {
    const { booking, packages, statuses } = usePage<PageProps>().props;

    const form = useForm({
        event_package_id: booking.event_package_id ?? '',
        event_date: booking.event_date?.split('T')[0] || '',
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

    const submit = () => {
        form.patch(`/event-bookings/${booking.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Event Bookings', href: '/event-bookings' }, { title: 'Edit', href: `/event-bookings/${booking.id}/edit` }]}>
            <Head title="Edit Booking" />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">Edit booking</h1>
                    <Link href="/event-bookings" className="text-sm font-semibold text-primary hover:underline">
                        Back to bookings
                    </Link>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            submit();
                        }}
                        className="grid grid-cols-1 gap-4 md:grid-cols-2"
                    >
                        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                            Package
                            <select
                                className="rounded-lg border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                value={form.data.event_package_id}
                                onChange={(e) => form.setData('event_package_id', e.target.value)}
                            >
                                <option value="">No package (custom)</option>
                                {packages.map((pkg) => (
                                    <option key={pkg.id} value={pkg.id}>
                                        {pkg.name} · {pkg.cup_count} cups
                                    </option>
                                ))}
                            </select>
                            {form.errors.event_package_id && <p className="text-sm text-red-700 dark:text-red-300">{form.errors.event_package_id}</p>}
                        </label>

                        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                            Status
                            <select
                                className="rounded-lg border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                value={form.data.status}
                                onChange={(e) => form.setData('status', e.target.value)}
                            >
                                {statuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                            Event date
                            <input
                                type="date"
                                required
                                className="rounded-lg border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                value={form.data.event_date}
                                onChange={(e) => form.setData('event_date', e.target.value)}
                            />
                            {form.errors.event_date && <p className="text-sm text-red-700 dark:text-red-300">{form.errors.event_date}</p>}
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                            <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                                Start time
                                <input
                                    type="time"
                                    className="rounded-lg border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    value={form.data.event_start_time}
                                    onChange={(e) => form.setData('event_start_time', e.target.value)}
                                />
                            </label>
                            <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                                Duration (mins)
                                <input
                                    type="number"
                                    min={30}
                                    className="rounded-lg border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    value={form.data.duration_minutes}
                                    onChange={(e) => form.setData('duration_minutes', e.target.value)}
                                />
                            </label>
                        </div>

                        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                            Event name
                            <input
                                className="rounded-lg border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                value={form.data.event_name}
                                onChange={(e) => form.setData('event_name', e.target.value)}
                                required
                            />
                        </label>

                        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                            Event type
                            <input
                                className="rounded-lg border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                value={form.data.event_type}
                                onChange={(e) => form.setData('event_type', e.target.value)}
                            />
                        </label>

                        <label className="md:col-span-2 flex flex-col gap-1 text-sm font-medium text-foreground">
                            Venue address
                            <textarea
                                className="rounded-lg border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                value={form.data.venue_address}
                                onChange={(e) => form.setData('venue_address', e.target.value)}
                                required
                                rows={2}
                            />
                        </label>

                        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                            Contact name
                            <input
                                className="rounded-lg border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                value={form.data.contact_name}
                                onChange={(e) => form.setData('contact_name', e.target.value)}
                                required
                            />
                        </label>

                        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                            Contact email
                            <input
                                type="email"
                                className="rounded-lg border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                value={form.data.contact_email}
                                onChange={(e) => form.setData('contact_email', e.target.value)}
                            />
                        </label>

                        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                            Contact phone
                            <input
                                className="rounded-lg border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                value={form.data.contact_phone}
                                onChange={(e) => form.setData('contact_phone', e.target.value)}
                            />
                        </label>

                        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                            Expected guests
                            <input
                                type="number"
                                min={1}
                                className="rounded-lg border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                value={form.data.expected_guests}
                                onChange={(e) => form.setData('expected_guests', e.target.value)}
                            />
                        </label>

                        <label className="md:col-span-2 flex flex-col gap-1 text-sm font-medium text-foreground">
                            Notes
                            <textarea
                                className="rounded-lg border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                                rows={3}
                            />
                        </label>

                        <div className="md:col-span-2 flex items-center justify-end gap-3">
                            <Link
                                href="/event-bookings"
                                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-60"
                            >
                                {form.processing ? 'Saving…' : 'Save changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
