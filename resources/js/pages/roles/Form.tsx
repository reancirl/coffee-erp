import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { FormEventHandler } from 'react';

interface Permission {
    id: number;
    name: string;
}

interface Role {
    id: number;
    name: string;
    permissions: Permission[];
}

interface Props {
    permissions: Permission[];
    role?: Role | null;
}

export default function RoleForm({ permissions, role }: Props) {
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        name: role?.name || '',
        permissions: role?.permissions.map(p => p.id) || [],
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (role) {
            patch(route('roles.update', role.id));
        } else {
            post(route('roles.store'));
        }
    };

    const handlePermissionChange = (permissionId: number, checked: boolean) => {
        if (checked) {
            setData('permissions', [...data.permissions, permissionId]);
        } else {
            setData('permissions', data.permissions.filter(id => id !== permissionId));
        }
    };

    const groupedPermissions = permissions.reduce((groups, permission) => {
        const module = permission.name.replace('access ', '');
        const category = module.charAt(0).toUpperCase() + module.slice(1);
        
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(permission);
        return groups;
    }, {} as Record<string, Permission[]>);

    return (
        <AppLayout>
            <Head title={role ? `Edit Role: ${role.name}` : 'Create Role'} />

            <div className="space-y-6 p-4">
                <div className="flex items-center gap-4">
                    <Link href={route('roles.index')}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Roles
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {role ? `Edit Role: ${role.name}` : 'Create New Role'}
                        </h1>
                        <p className="text-muted-foreground">
                            {role ? 'Update role details and permissions' : 'Create a new role and assign permissions'}
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Role Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Role Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className={errors.name ? 'border-destructive' : ''}
                                    placeholder="Enter role name"
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Permissions</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Select the permissions this role should have
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                                    <div key={category} className="space-y-3">
                                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                                            {category}
                                        </h4>
                                        <div className="space-y-2">
                                            {categoryPermissions.map((permission) => (
                                                <div key={permission.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`permission-${permission.id}`}
                                                        checked={data.permissions.includes(permission.id)}
                                                        onCheckedChange={(checked) => 
                                                            handlePermissionChange(permission.id, checked as boolean)
                                                        }
                                                    />
                                                    <Label 
                                                        htmlFor={`permission-${permission.id}`}
                                                        className="text-sm font-normal cursor-pointer"
                                                    >
                                                        {permission.name.replace('access ', '').charAt(0).toUpperCase() + 
                                                         permission.name.replace('access ', '').slice(1)}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {errors.permissions && (
                                <p className="text-sm text-destructive mt-2">{errors.permissions}</p>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Saving...' : (role ? 'Update Role' : 'Create Role')}
                        </Button>
                        <Link href={route('roles.index')}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
