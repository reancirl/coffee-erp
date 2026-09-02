import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout, { withAppShell } from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { FormEventHandler } from 'react';
import InputError from '@/components/input-error';

interface Customer {
    id?: number;
    known_name: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    date_of_birth: string;
    loyalty_points_balance: number;
    membership_tier: string;
    notes: string;
}

interface Props {
    customer?: Customer;
}

type CustomerForm = {
    known_name: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    date_of_birth: string;
    loyalty_points_balance: number;
    membership_tier: string;
    notes: string;
};

export default function Form({ customer }: Props) {
    const isEditing = !!customer;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Customers',
            href: '/customers',
        },
        {
            title: isEditing ? 'Edit Customer' : 'Create Customer',
            href: isEditing ? `/customers/${customer.id}/edit` : '/customers/create',
        },
    ];

    const { data, setData, post, put, processing, errors, reset } = useForm<CustomerForm>({
        known_name: customer?.known_name || '',
        first_name: customer?.first_name || '',
        last_name: customer?.last_name || '',
        email: customer?.email || '',
        phone_number: customer?.phone_number || '',
        date_of_birth: customer?.date_of_birth || '',
        loyalty_points_balance: customer?.loyalty_points_balance || 0,
        membership_tier: customer?.membership_tier || '',
        notes: customer?.notes || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (isEditing) {
            put(route('customers.update', customer.id), {
                onSuccess: () => reset(),
            });
        } else {
            post(route('customers.store'), {
                onSuccess: () => reset(),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? 'Edit Customer' : 'Create Customer'} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Link href={route('customers.index')}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Customers
                        </Button>
                    </Link>
                    <h2 className="text-2xl font-bold">
                        {isEditing ? 'Edit Customer' : 'Create New Customer'}
                    </h2>
                </div>

                <div className="max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Information</CardTitle>
                            <CardDescription>
                                {isEditing
                                    ? 'Update the customer details below'
                                    : 'Enter the details for the new customer'
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label htmlFor="known_name">Known Name</Label>
                                        <Input
                                            id="known_name"
                                            type="text"
                                            value={data.known_name}
                                            onChange={(e) => setData('known_name', e.target.value)}
                                            required
                                            placeholder="Enter known name"
                                        />
                                        <InputError message={errors.known_name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="first_name">First Name</Label>
                                        <Input
                                            id="first_name"
                                            type="text"
                                            value={data.first_name}
                                            onChange={(e) => setData('first_name', e.target.value)}
                                            required
                                            placeholder="Enter first name"
                                        />
                                        <InputError message={errors.first_name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="last_name">Last Name</Label>
                                        <Input
                                            id="last_name"
                                            type="text"
                                            value={data.last_name}
                                            onChange={(e) => setData('last_name', e.target.value)}
                                            required
                                            placeholder="Enter last name"
                                        />
                                        <InputError message={errors.last_name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="Enter email address"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div>
                                        <Label htmlFor="phone_number">Phone Number</Label>
                                        <Input
                                            id="phone_number"
                                            type="tel"
                                            value={data.phone_number}
                                            onChange={(e) => setData('phone_number', e.target.value)}
                                            placeholder="Enter phone number"
                                        />
                                        <InputError message={errors.phone_number} />
                                    </div>

                                    <div>
                                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                                        <Input
                                            id="date_of_birth"
                                            type="date"
                                            value={data.date_of_birth}
                                            onChange={(e) => setData('date_of_birth', e.target.value)}
                                        />
                                        <InputError message={errors.date_of_birth} />
                                    </div>

                                    <div className="md:col-span-2">
                                        <Label htmlFor="membership_tier">Membership Tier</Label>
                                        <Select
                                            value={data.membership_tier || 'none'}
                                            onValueChange={(value) => setData('membership_tier', value === 'none' ? '' : value)}
                                        >
                                            <SelectTrigger id="membership_tier">
                                                <SelectValue placeholder="Select a tier" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No Tier</SelectItem>
                                                <SelectItem value="bronze">Bronze</SelectItem>
                                                <SelectItem value="silver">Silver</SelectItem>
                                                <SelectItem value="gold">Gold</SelectItem>
                                                <SelectItem value="platinum">Platinum</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.membership_tier} />
                                    </div>

                                    <div className="md:col-span-2">
                                        <Label htmlFor="notes">Notes</Label>
                                        <Textarea
                                            id="notes"
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            placeholder="Enter any notes about this customer (optional)"
                                            rows={3}
                                        />
                                        <InputError message={errors.notes} />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end space-x-2">
                                    <Link href={route('customers.index')}>
                                        <Button variant="outline" type="button">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Saving...' : (isEditing ? 'Update Customer' : 'Create Customer')}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

Form.layout = withAppShell;
