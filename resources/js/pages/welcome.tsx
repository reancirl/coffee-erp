import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PublicFooter } from '@/components/public-footer';
import { PublicHeader } from '@/components/public-header';
import { useEffect, useMemo, useState } from 'react';

type PackageProduct = {
    id: number;
    name: string;
};

type EventPackage = {
    id: number;
    name: string;
    cup_count: number;
    price: string;
    description?: string | null;
    products?: PackageProduct[];
};

interface PageProps {
    packages: EventPackage[];
    blockedDates: string[];
    today: string;
    flash?: {
        success?: string;
        error?: string;
    };
    auth?: {
        user?: unknown;
    };
    errors?: Record<string, string>;
}

const steps = [
    { title: 'Pick a date', description: 'Choose your event day — one booking per day.' },
    { title: 'Pick a package', description: 'Choose how many cups you want us to serve.' },
    { title: 'Event details & submit', description: 'Where we’re going and how to reach us before payment.' },
    { title: 'Confirmation', description: 'Your request is in. We’ll follow up to finalize.' },
];

export default function Welcome() {
    const { packages, blockedDates, today, flash, auth, errors } = usePage<PageProps>().props;
    const isLoggedIn = Boolean(auth?.user);
    const [currentStep, setCurrentStep] = useState(0);
    const [dateWarning, setDateWarning] = useState<string | null>(null);
    const [successSummary, setSuccessSummary] = useState<{ date?: string; packageName?: string } | null>(null);
    const [showReview, setShowReview] = useState(false);
    const [menuPackage, setMenuPackage] = useState<EventPackage | null>(null);

    const sortedPackages = useMemo(() => [...packages].sort((a, b) => a.cup_count - b.cup_count), [packages]);

    const form = useForm({
        event_package_id: sortedPackages[0]?.id ?? '',
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
        notes: '',
    });

    useEffect(() => {
        if (flash?.success) {
            setCurrentStep(steps.length - 1);
        }
    }, [flash?.success]);

    // When server validation fails, jump to the step that needs attention
    useEffect(() => {
        const err = form.errors;
        if (!err || Object.keys(err).length === 0) {
            return;
        }
        if (err.event_date) {
            setCurrentStep(0);
        } else if (err.event_package_id) {
            setCurrentStep(1);
        } else {
            setCurrentStep(2);
        }
    }, [form.errors]);

    const isBlocked = (value: string) => value && blockedDates.includes(value);

    const canProceed = () => {
        if (currentStep === 0) {
            return Boolean(form.data.event_date) && !isBlocked(form.data.event_date);
        }
        if (currentStep === 1) {
            return Boolean(form.data.event_package_id);
        }
        if (currentStep === 2) {
            return Boolean(
                form.data.event_name &&
                    form.data.venue_address &&
                    form.data.contact_name &&
                    (form.data.contact_email || form.data.contact_phone),
            );
        }
        return true;
    };

    const next = () => {
        if (!canProceed()) {
            return;
        }
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    };

    const previous = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

    const submit = () => {
        const payload = { ...form.data };
        form.post('/event-bookings/public', {
            preserveScroll: true,
            onSuccess: () => {
                const pkg = sortedPackages.find((p) => String(p.id) === String(payload.event_package_id));
                setSuccessSummary({
                    date: payload.event_date,
                    packageName: pkg ? pkg.name : undefined,
                });
                form.reset(
                    'event_date',
                    'event_start_time',
                    'duration_minutes',
                    'event_name',
                    'event_type',
                    'venue_address',
                    'contact_name',
                    'contact_email',
                    'contact_phone',
                    'expected_guests',
                    'notes',
                );
                setCurrentStep(steps.length - 1);
                setShowReview(false);
            },
        });
    };

    const selectedPackage = sortedPackages.find((pkg) => String(pkg.id) === String(form.data.event_package_id));

    return (
        <>
            <Head title="Book our coffee cart" />
            <div className="min-h-screen bg-white">
                <PublicHeader isLoggedIn={isLoggedIn} />

                <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 lg:flex-row lg:items-start lg:py-14">
                    <div className="lg:w-2/5">
                        {form.errors && Object.keys(form.errors).length > 0 && (
                            <div className="mb-4 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                                <p className="font-semibold">Please review the form — some fields need your attention.</p>
                                <ul className="mt-2 list-disc space-y-1 pl-5">
                                    {Object.values(form.errors).map((msg, idx) => (
                                        <li key={idx}>{msg}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-500">Mobile coffee cart & events</p>
                            <h1 className="mt-3 text-4xl font-bold text-gray-900 leading-tight">Bring EASTLONE to your event.</h1>
                            <p className="mt-3 text-base text-gray-600">
                                Reserve a date, select a package, and tell us about your event. We’ll reach out to confirm and finalize the
                                payment.
                            </p>

                            {flash?.success && (
                                <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800">
                                    {flash.success}
                                </div>
                            )}

                            <div className="mt-5 flex flex-col gap-3 text-sm text-gray-700">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex h-2 w-2 rounded-full bg-primary" /> One booking per day
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex h-2 w-2 rounded-full bg-primary" /> Locally sourced beans
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex h-2 w-2 rounded-full bg-primary" /> Barista + cart setup included
                                </div>
                            </div>
                        </div>

                    <div className="mt-6 grid grid-cols-3 gap-3 text-sm text-gray-700 sm:grid-cols-3">
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-xs uppercase text-gray-500">Step 1</p>
                            <p className="font-semibold text-gray-900">Pick a date</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-xs uppercase text-gray-500">Step 2</p>
                            <p className="font-semibold text-gray-900">Choose package</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-xs uppercase text-gray-500">Step 3</p>
                            <p className="font-semibold text-gray-900">Event details & submit</p>
                        </div>
                    </div>
                    </div>

                    <div className="flex-1 space-y-6">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <Stepper currentStep={currentStep} />

                            <div className="mt-6 space-y-6">
                                {currentStep === 0 && (
                                    <div className="space-y-4">
                                        <label className="flex flex-col gap-2 text-sm font-medium text-gray-800">
                                            Event date
                                            <CalendarDatePicker
                                                value={form.data.event_date}
                                                blockedDates={blockedDates}
                                                minDate={today}
                                                onSelect={(value) => {
                                                    form.setData('event_date', value);
                                                    if (isBlocked(value)) {
                                                        setDateWarning('Sorry, that day is already booked.');
                                                    } else {
                                                        setDateWarning(null);
                                                    }
                                                }}
                                            />
                                        {dateWarning && <p className="text-sm text-primary">{dateWarning}</p>}
                                        {!dateWarning && form.data.event_date && (
                                            <p className="text-sm text-gray-600">Looks good — that date is open.</p>
                                        )}
                                        {form.errors.event_date && (
                                            <p className="text-sm text-red-700">{form.errors.event_date}</p>
                                        )}
                                    </label>

                                        <div className="grid grid-cols-2 gap-3">
                                            <label className="flex flex-col gap-1 text-sm font-medium text-gray-800">
                                                Start time
                                                <input
                                                    type="time"
                                                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                    value={form.data.event_start_time}
                                                    onChange={(e) => form.setData('event_start_time', e.target.value)}
                                                />
                                            </label>
                                            <label className="flex flex-col gap-1 text-sm font-medium text-gray-800">
                                                Duration (hours)
                                                <input
                                                    type="number"
                                                    min={1}
                                                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                    value={
                                                        form.data.duration_minutes
                                                            ? Number(form.data.duration_minutes) / 60
                                                            : ''
                                                    }
                                                    onChange={(e) => {
                                                        const hours = e.target.value;
                                                        if (!hours) {
                                                            form.setData('duration_minutes', '');
                                                            return;
                                                        }
                                                        const numericHours = Number(hours);
                                                        form.setData('duration_minutes', Number.isFinite(numericHours) ? numericHours * 60 : '');
                                                    }}
                                                    placeholder="4"
                                                />
                                            </label>
                                        </div>

                                        <p className="text-sm text-gray-600">
                                            We only take one event per day. Dates already booked or blocked won’t be available.
                                        </p>
                                    </div>
                                )}

                                {currentStep === 1 && (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {sortedPackages.map((pkg) => (
                                            <button
                                                key={pkg.id}
                                                type="button"
                                                onClick={() => form.setData('event_package_id', pkg.id)}
                                                className={`cursor-pointer rounded-xl border px-4 py-4 text-left transition ${
                                                    String(form.data.event_package_id) === String(pkg.id)
                                                        ? 'border-primary bg-primary/5 shadow-sm'
                                                        : 'border-gray-200 bg-gray-50 hover:border-primary'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs uppercase tracking-wide text-gray-500">{pkg.cup_count} cups</p>
                                                    <p className="text-lg font-semibold text-gray-900">{pkg.name}</p>
                                                    </div>
                                                    <p className="text-lg font-bold text-gray-900">₱{Number(pkg.price).toLocaleString()}</p>
                                                </div>
                                                {pkg.description && <p className="mt-2 text-sm text-gray-600">{pkg.description}</p>}
                                                {pkg.products?.length ? (
                                                    <div className="mt-3">
                                                        <button
                                                            type="button"
                                                            className="inline-flex items-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setMenuPackage(pkg);
                                                            }}
                                                        >
                                                            View menu ({pkg.products.length})
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </button>
                                        ))}
                                        {form.errors.event_package_id && (
                                            <p className="text-sm text-red-700">{form.errors.event_package_id}</p>
                                        )}
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <div className="space-y-4">
                                        <label className="flex flex-col gap-1 text-sm font-medium text-gray-800">
                                            Event name
                                            <input
                                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                value={form.data.event_name}
                                                onChange={(e) => form.setData('event_name', e.target.value)}
                                                required
                                                placeholder="Product launch, wedding reception"
                                            />
                                            {form.errors.event_name && (
                                                <p className="text-sm text-red-700">{form.errors.event_name}</p>
                                            )}
                                        </label>

                                        <label className="flex flex-col gap-1 text-sm font-medium text-gray-800">
                                            Event type
                                            <input
                                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                value={form.data.event_type}
                                                onChange={(e) => form.setData('event_type', e.target.value)}
                                                placeholder="Corporate, social, campus"
                                            />
                                            {form.errors.event_type && (
                                                <p className="text-sm text-red-700">{form.errors.event_type}</p>
                                            )}
                                        </label>

                                        <label className="flex flex-col gap-1 text-sm font-medium text-gray-800">
                                            Venue address
                                            <textarea
                                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                value={form.data.venue_address}
                                                onChange={(e) => form.setData('venue_address', e.target.value)}
                                                required
                                                rows={2}
                                                placeholder="Street, city, access notes"
                                            />
                                            {form.errors.venue_address && (
                                                <p className="text-sm text-red-700">{form.errors.venue_address}</p>
                                            )}
                                        </label>

                                        <div className="grid grid-cols-2 gap-3">
                                            <label className="flex flex-col gap-1 text-sm font-medium text-gray-800">
                                                Contact name
                                                <input
                                                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                    value={form.data.contact_name}
                                                    onChange={(e) => form.setData('contact_name', e.target.value)}
                                                    required
                                                />
                                                {form.errors.contact_name && (
                                                    <p className="text-sm text-red-700">{form.errors.contact_name}</p>
                                                )}
                                            </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-800">
            Contact phone
            <input
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={form.data.contact_phone}
                onChange={(e) => form.setData('contact_phone', e.target.value)}
                placeholder="+63 900 000 0000"
            />
            {(form.errors.contact_phone || form.errors.contact_email) && (
                <p className="text-sm text-red-700">
                    {form.errors.contact_phone || form.errors.contact_email}
                </p>
            )}
        </label>

                                            <label className="flex flex-col gap-1 text-sm font-medium text-gray-800">
                                                Contact email
                                                <input
                                                    type="email"
                                                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                    value={form.data.contact_email}
                                                    onChange={(e) => form.setData('contact_email', e.target.value)}
                                                    placeholder="hello@brand.com"
                                                />
                                                {(form.errors.contact_email || form.errors.contact_phone) && (
                                                    <p className="text-sm text-red-700">
                                                        {form.errors.contact_email || form.errors.contact_phone}
                                                    </p>
                                                )}
                                            </label>
                                        </div>

                                        <label className="flex flex-col gap-1 text-sm font-medium text-gray-800">
                                            Expected guests
                                            <input
                                                type="number"
                                                min={1}
                                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                value={form.data.expected_guests}
                                                onChange={(e) => form.setData('expected_guests', e.target.value)}
                                                placeholder="50"
                                            />
                                            {form.errors.expected_guests && (
                                                <p className="text-sm text-red-700">{form.errors.expected_guests}</p>
                                            )}
                                        </label>

                                        <label className="flex flex-col gap-1 text-sm font-medium text-gray-800">
                                            Notes
                                            <textarea
                                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                value={form.data.notes}
                                                onChange={(e) => form.setData('notes', e.target.value)}
                                                rows={2}
                                                placeholder="Any specific drinks, setup, or timing details"
                                            />
                                        </label>

                                    </div>
                                )}
                                {currentStep === 3 && (
                                    <div className="space-y-4 rounded-xl border border-green-200 bg-green-50 p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700 font-bold">
                                                ✓
                                            </div>
                                            <div>
                                                <p className="text-sm uppercase tracking-[0.2em] text-green-800">Confirmation</p>
                                                <p className="text-lg font-semibold text-green-900">Your booking request is in.</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-green-900">
                                            We’ll reach out to finalize the payment and details. You’ll get an email/text from our team shortly.
                                        </p>
                                        <div className="rounded-lg border border-green-200 bg-white p-3 text-sm text-gray-800 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600">Package</span>
                                                <span className="font-semibold text-gray-900">
                                                    {successSummary?.packageName ?? selectedPackage?.name ?? 'Custom package'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600">Target date</span>
                                                <span className="font-semibold text-gray-900">
                                                    {successSummary?.date || form.data.event_date || form.data.event_date || '—'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="rounded-lg border border-green-200 bg-white px-3 py-2 text-sm text-gray-800">
                                            Prefer to chat first? Message us on{' '}
                                            <a
                                                href="https://www.facebook.com/eastlonecafe"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="cursor-pointer font-semibold text-primary hover:underline"
                                            >
                                                Facebook
                                            </a>{' '}
                                            and we’ll help you set this up.
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={previous}
                                    disabled={currentStep === 0}
                                    className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 disabled:opacity-40"
                                >
                                    Back
                                </button>

                                {currentStep < steps.length - 2 && (
                                    <button
                                        type="button"
                                        onClick={next}
                                        disabled={!canProceed()}
                                        className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        Next step
                                    </button>
                                )}

                                {currentStep === steps.length - 2 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowReview(true)}
                                        disabled={form.processing || !canProceed()}
                                        className="cursor-pointer rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        Review booking details
                                    </button>
                                )}
                                {currentStep === steps.length - 1 && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCurrentStep(0);
                                                setSuccessSummary(null);
                                            }}
                                            className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100"
                                        >
                                            Book another event
                                        </button>
                                        {isLoggedIn && (
                                            <Link
                                                href="/dashboard"
                                                className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
                                            >
                                                Go to dashboard
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
                <Dialog open={Boolean(menuPackage)} onOpenChange={(open) => setMenuPackage(open ? menuPackage : null)}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{menuPackage?.name || 'Package menu'}</DialogTitle>
                            {menuPackage?.description && (
                                <DialogDescription>{menuPackage.description}</DialogDescription>
                            )}
                        </DialogHeader>
                        <div className="space-y-2 text-sm text-gray-800">
                            {menuPackage && (
                                <div className="flex items-center justify-between text-gray-700">
                                    <span className="font-medium">{menuPackage.cup_count} cups</span>
                                    <span className="font-semibold text-gray-900">
                                        ₱{Number(menuPackage.price).toLocaleString()}
                                    </span>
                                </div>
                            )}
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                {menuPackage?.products?.length ? (
                                    <ul className="space-y-1">
                                        {menuPackage.products.map((product) => (
                                            <li key={product.id} className="flex items-center gap-2 text-gray-900">
                                                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                {product.name}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-600">No menu items listed for this package yet.</p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <button
                                type="button"
                                onClick={() => setMenuPackage(null)}
                                className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100"
                            >
                                Close
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <ReviewModal
                    open={showReview}
                    onOpenChange={setShowReview}
                    onSubmit={submit}
                    formData={form.data}
                    selectedPackage={selectedPackage}
                    processing={form.processing}
                />
                <PublicFooter />
            </div>
        </>
    );
}

function Stepper({ currentStep }: { currentStep: number }) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                {steps.map((step, idx) => (
                    <div key={step.title} className="flex flex-1 items-center">
                        <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${
                                idx <= currentStep
                                    ? 'border-gray-900 bg-gray-900 text-white'
                                    : 'border-gray-300 bg-white text-gray-700'
                            }`}
                        >
                            {idx + 1}
                        </div>
                        {idx < steps.length - 1 && <div className="h-px flex-1 bg-gradient-to-r from-gray-300 to-gray-100" />}
                    </div>
                ))}
            </div>
            <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gray-900">{steps[currentStep].title}</p>
                <p className="text-sm text-gray-800">{steps[currentStep].description}</p>
            </div>
        </div>
    );
}

type CalendarDatePickerProps = {
    value: string;
    blockedDates: string[];
    minDate: string;
    onSelect: (value: string) => void;
};

function CalendarDatePicker({ value, blockedDates, minDate, onSelect }: CalendarDatePickerProps) {
    const parseLocalDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, (m || 1) - 1, d || 1);
    };

    const bookableMinDate = (() => {
        const d = parseLocalDate(minDate);
        d.setDate(d.getDate() + 1); // block out today; bookings start tomorrow
        return d;
    })();

    const [monthCursor, setMonthCursor] = useState(() => {
        return new Date(bookableMinDate.getFullYear(), bookableMinDate.getMonth(), 1);
    });

    const startOfMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const endOfMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0);
    const startWeekday = startOfMonth.getDay(); // 0-6
    const daysInMonth = endOfMonth.getDate();

    const minDateObj = bookableMinDate;

    const formatDate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const isBlockedDate = (date: Date) => blockedDates.includes(formatDate(date));
    const isBeforeMin = (date: Date) => date < minDateObj;

    const selectedDate = value ? parseLocalDate(value) : null;
    const isSelected = (date: Date) => selectedDate && formatDate(date) === formatDate(selectedDate);

    const canGoPrev =
        monthCursor.getFullYear() > minDateObj.getFullYear() ||
        (monthCursor.getFullYear() === minDateObj.getFullYear() && monthCursor.getMonth() > minDateObj.getMonth());

    const weeks: Array<Array<Date | null>> = [];
    let current: Array<Date | null> = Array(startWeekday).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
        current.push(new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day));
        if (current.length === 7) {
            weeks.push(current);
            current = [];
        }
    }
    if (current.length) {
        while (current.length < 7) current.push(null);
        weeks.push(current);
    }

    const monthLabel = monthCursor.toLocaleString(undefined, { month: 'long', year: 'numeric' });

    return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() =>
                        setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))
                    }
                    disabled={!canGoPrev}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-700 disabled:opacity-40"
                >
                    ‹
                </button>
                <p className="text-sm font-semibold text-gray-900">{monthLabel}</p>
                <button
                    type="button"
                    onClick={() =>
                        setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))
                    }
                    className="rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-700"
                >
                    ›
                </button>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-500">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day}>{day}</div>
                ))}
            </div>
            <div className="mt-2 space-y-2">
                {weeks.map((week, idx) => (
                    <div key={idx} className="grid grid-cols-7 gap-2 text-center">
                        {week.map((date, dayIdx) => {
                            if (!date) return <div key={dayIdx} />;

                            const disabled = isBeforeMin(date) || isBlockedDate(date);
                            const selected = isSelected(date);

                            return (
                                <button
                                    key={dayIdx}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => onSelect(formatDate(date))}
                                    className={`rounded-lg border px-2 py-2 text-sm ${
                                        disabled
                                            ? 'cursor-not-allowed border-gray-200 bg-white text-gray-300 line-through'
                                            : selected
                                            ? 'border-primary bg-primary/10 text-gray-900'
                                            : 'cursor-pointer border-gray-200 bg-white text-gray-800 hover:border-primary'
                                    }`}
                                >
                                    {date.getDate()}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

type ReviewModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: () => void;
    formData: typeof formDataShape;
    selectedPackage: EventPackage | undefined;
    processing: boolean;
};

// Helper to mirror form shape without pulling state inside component
const formDataShape = {
    event_package_id: '',
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
    notes: '',
};

function ReviewModal({ open, onOpenChange, onSubmit, formData, selectedPackage, processing }: ReviewModalProps) {
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—';
        const parsed = Date.parse(dateStr + 'T00:00:00');
        if (Number.isNaN(parsed)) return dateStr;
        return new Date(parsed).toLocaleDateString(undefined, {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const displayHours = formData.duration_minutes
        ? Number(formData.duration_minutes) / 60
        : '';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Review booking</DialogTitle>
                    <DialogDescription>Confirm the details below before submitting.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 text-sm text-gray-800">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Date</span>
                        <span className="font-semibold text-gray-900">{formatDate(formData.event_date)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Start time</span>
                        <span className="font-semibold text-gray-900">{formData.event_start_time || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Duration</span>
                        <span className="font-semibold text-gray-900">
                            {displayHours ? `${displayHours} ${displayHours === 1 ? 'hour' : 'hours'}` : '—'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Package</span>
                        <span className="font-semibold text-gray-900">{selectedPackage?.name ?? 'Custom package'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Event</span>
                        <span className="font-semibold text-gray-900">{formData.event_name || '—'}</span>
                    </div>
                    <div>
                        <p className="text-gray-600">Venue</p>
                        <p className="font-semibold text-gray-900">{formData.venue_address || '—'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-gray-600">Contact name</p>
                            <p className="font-semibold text-gray-900">{formData.contact_name || '—'}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Contact phone</p>
                            <p className="font-semibold text-gray-900">{formData.contact_phone || '—'}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Contact email</p>
                            <p className="font-semibold text-gray-900">{formData.contact_email || '—'}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Guests</p>
                            <p className="font-semibold text-gray-900">{formData.expected_guests || '—'}</p>
                        </div>
                    </div>
                    {formData.notes && (
                        <div>
                            <p className="text-gray-600">Notes</p>
                            <p className="font-semibold text-gray-900 whitespace-pre-line">{formData.notes}</p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100"
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={processing}
                        className="cursor-pointer rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
                    >
                        {processing ? 'Submitting…' : 'Submit booking'}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
