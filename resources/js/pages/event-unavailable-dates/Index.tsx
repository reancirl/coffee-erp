import AppLayout from '@/layouts/app-layout';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

type BlockedDate = {
    id: number;
    unavailable_date: string;
    reason?: string | null;
};

interface PageProps {
    dates: BlockedDate[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function EventUnavailableDates() {
    const { dates, flash } = usePage<PageProps>().props;
    const [showCreate, setShowCreate] = useState(false);

    const form = useForm({
        unavailable_date: '',
        reason: '',
    });

    return (
        <AppLayout breadcrumbs={[{ title: 'Blocked Dates', href: '/event-unavailable-dates' }]}>
            <Head title="Blocked Dates" />
            <div className="flex flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/40 px-4 py-2 text-green-800 dark:text-green-300">{flash.success}</div>
                )}

                <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm uppercase tracking-wide text-muted-foreground">Calendar</p>
                            <h2 className="text-xl font-semibold text-foreground">Upcoming blocked days</h2>
                        </div>
                        <Dialog open={showCreate} onOpenChange={setShowCreate}>
                            <DialogTrigger asChild>
                                <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90">
                                    Block a date
                                </button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Block an unavailable date</DialogTitle>
                                    <DialogDescription>Set blackout days for the coffee cart.</DialogDescription>
                                </DialogHeader>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        form.post('/event-unavailable-dates', {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                form.reset();
                                                setShowCreate(false);
                                            },
                                        });
                                    }}
                                    className="grid grid-cols-1 gap-4 md:grid-cols-2"
                                >
                                    <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                                        Date
                                        <input
                                            type="date"
                                            required
                                            className="rounded-lg border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            value={form.data.unavailable_date}
                                            onChange={(e) => form.setData('unavailable_date', e.target.value)}
                                        />
                                    </label>
                                    <label className="md:col-span-2 flex flex-col gap-1 text-sm font-medium text-foreground">
                                        Reason (optional)
                                        <input
                                            className="rounded-lg border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            value={form.data.reason}
                                            onChange={(e) => form.setData('reason', e.target.value)}
                                            placeholder="Private event, machine service day, staff training"
                                        />
                                    </label>
                                    <DialogFooter className="md:col-span-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowCreate(false)}
                                            className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={form.processing}
                                            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground shadow hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {form.processing ? 'Saving…' : 'Block date'}
                                        </button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="divide-y divide-border rounded-xl border border-border bg-muted/60">
                        {dates.length === 0 && (
                            <p className="p-4 text-sm text-muted-foreground">No blackout dates yet.</p>
                        )}

                        {dates.map((date) => (
                            <DateRow key={date.id} date={date} />
                        ))}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}

function DateRow({ date }: { date: BlockedDate }) {
    const { delete: destroy, processing } = useForm({});

    const formatted = new Date(date.unavailable_date + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
                <p className="font-semibold text-foreground">{formatted}</p>
                {date.reason && <p className="text-sm text-muted-foreground">{date.reason}</p>}
            </div>
            <button
                type="button"
                onClick={() => destroy(`/event-unavailable-dates/${date.id}`, { preserveScroll: true })}
                disabled={processing}
                className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:border-red-400 hover:text-red-600 dark:hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
                Remove
            </button>
        </div>
    );
}
