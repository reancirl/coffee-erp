import AppLayout, { withAppShell } from '@/layouts/app-layout';
import { Head, useForm, usePage } from '@inertiajs/react';

type EventPackage = {
    id: number;
    name: string;
    cup_count: number;
    price: string;
};

interface PageProps {
    packages: EventPackage[];
    statuses: string[];
}

const currency = (value: number | string) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(Number(value || 0));

export default function EventBookingCreate() {
    const { packages, statuses } = usePage<PageProps>().props;

    const form = useForm({
        event_package_id: packages[0]?.id ?? '',
        event_date: '',
        event_start_time: '',
        duration_minutes: '',
        event_name: '',
        event_type: '',
        venue_address: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        expected_guests: '',
        status: 'pending',
        notes: '',
    });

    const submit = () => {
        form.post('/event-bookings', {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Event Bookings', href: '/event-bookings' }, { title: 'Create', href: '/event-bookings/create' }]}>
            <Head title="New Event Booking" />
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4">
                    <p className="text-sm uppercase tracking-wide text-muted-foreground">New booking</p>
                    <h1 className="text-2xl font-bold text-foreground">Add a booking manually</h1>
                    <p className="text-sm text-muted-foreground">Use this for leads that come in outside the website.</p>
                </div>

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
                                    {pkg.name} · {pkg.cup_count} cups · {currency(pkg.price)}
                                </option>
                            ))}
                        </select>
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
                                placeholder="120"
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
                            placeholder="Product launch, wedding reception"
                        />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                        Event type
                        <input
                            className="rounded-lg border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={form.data.event_type}
                            onChange={(e) => form.setData('event_type', e.target.value)}
                            placeholder="Corporate, social, campus"
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
                            placeholder="Street, city, access notes"
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
                            placeholder="hello@brand.com"
                        />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                        Contact phone
                        <input
                            className="rounded-lg border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={form.data.contact_phone}
                            onChange={(e) => form.setData('contact_phone', e.target.value)}
                            placeholder="+63 900 000 0000"
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
                            placeholder="50"
                        />
                    </label>

                    <label className="md:col-span-2 flex flex-col gap-1 text-sm font-medium text-foreground">
                        Internal notes
                        <textarea
                            className="rounded-lg border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={form.data.notes}
                            onChange={(e) => form.setData('notes', e.target.value)}
                            rows={2}
                            placeholder="Payment follow-up, travel surcharge, special setup"
                        />
                    </label>

                    <div className="md:col-span-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => history.back()}
                            className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground shadow hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {form.processing ? 'Saving…' : 'Save booking'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

EventBookingCreate.layout = withAppShell;
