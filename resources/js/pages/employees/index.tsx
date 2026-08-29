import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCog, Search, Coffee } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employee Management',
        href: '/employees',
    },
];

interface Employee {
    id: number;
    name: string;
    email: string;
    employee_code: string | null;
    position: string | null;
    employment_status: string;
    allowance_eligible: boolean;
    can_redeem_allowance: boolean;
    ineligibility_reason: string | null;
}

interface Props {
    employees: {
        data: Employee[];
        meta: { current_page: number; last_page: number; total: number };
    };
    filters: { search?: string; eligible_only?: boolean };
    statuses: string[];
}

const initials = (name: string) =>
    name
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

export default function Index({ employees, filters, statuses }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [editing, setEditing] = useState<Employee | null>(null);

    // Draft state for the edit dialog.
    const [position, setPosition] = useState('');
    const [status, setStatus] = useState('active');
    const [eligible, setEligible] = useState(false);
    const [saving, setSaving] = useState(false);

    const applyFilters = (overrides: Record<string, unknown> = {}) => {
        router.get(
            '/employees',
            { search: search || undefined, eligible_only: filters.eligible_only || undefined, ...overrides },
            { preserveState: true, replace: true },
        );
    };

    const openEditor = (employee: Employee) => {
        setEditing(employee);
        setPosition(employee.position ?? '');
        setStatus(employee.employment_status);
        setEligible(employee.allowance_eligible);
    };

    const save = () => {
        if (!editing) return;
        setSaving(true);
        router.patch(
            `/employees/${editing.id}`,
            { position: position || null, employment_status: status, allowance_eligible: eligible },
            {
                preserveScroll: true,
                onFinish: () => setSaving(false),
                onSuccess: () => setEditing(null),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee Management" />
            <div className="flex h-full flex-1 flex-col gap-4 p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="flex items-center gap-2 text-2xl font-bold">
                        <UserCog className="h-6 w-6" />
                        Employee Management
                    </h1>
                    <p className="text-sm text-gray-600">
                        {employees.meta.total} {employees.meta.total === 1 ? 'employee' : 'employees'} &middot; allowance eligibility is
                        set here
                    </p>
                </div>

                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="text-base">Directory</CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    className="w-64 pl-8"
                                    placeholder="Search name, email or code"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                />
                            </div>
                            <Button variant="outline" onClick={() => applyFilters()}>
                                Search
                            </Button>
                            <Button
                                variant={filters.eligible_only ? 'default' : 'outline'}
                                onClick={() => applyFilters({ eligible_only: !filters.eligible_only || undefined })}
                            >
                                <Coffee className="mr-1 h-4 w-4" />
                                Allowance eligible
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Position</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Allowance Eligible</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                                            No employees found.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {employees.data.map((employee) => (
                                    <TableRow key={employee.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                                                    {initials(employee.name)}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{employee.name}</div>
                                                    <div className="text-xs text-gray-500">{employee.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {employee.employee_code ? (
                                                <span className="font-mono text-sm">{employee.employee_code}</span>
                                            ) : (
                                                <span className="text-gray-400">&mdash;</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{employee.position ?? <span className="text-gray-400">&mdash;</span>}</TableCell>
                                        <TableCell>
                                            <Badge variant={employee.employment_status === 'active' ? 'default' : 'secondary'}>
                                                {employee.employment_status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {employee.can_redeem_allowance ? (
                                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Yes</Badge>
                                            ) : (
                                                <span
                                                    className="text-sm text-gray-500"
                                                    title={employee.ineligibility_reason ?? undefined}
                                                >
                                                    No
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="outline" onClick={() => openEditor(employee)}>
                                                Edit
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="position">Position</Label>
                            <Input
                                id="position"
                                value={position}
                                placeholder="e.g. Barista"
                                onChange={(e) => setPosition(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="status">Employment status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((value) => (
                                        <SelectItem key={value} value={value}>
                                            {value}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-start gap-3 rounded-md border p-3">
                            <Checkbox
                                id="eligible"
                                checked={eligible}
                                onCheckedChange={(value) => setEligible(value === true)}
                            />
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="eligible">Eligible for coffee allowance</Label>
                                <p className="text-xs text-gray-500">
                                    {editing?.employee_code
                                        ? `Employee code ${editing.employee_code} is permanent and will not change.`
                                        : 'An employee code will be issued on save.'}
                                </p>
                            </div>
                        </div>

                        {editing && !editing.can_redeem_allowance && editing.ineligibility_reason && (
                            <p className="text-xs text-amber-600">Currently blocked: {editing.ineligibility_reason}</p>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditing(null)}>
                            Cancel
                        </Button>
                        <Button onClick={save} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
