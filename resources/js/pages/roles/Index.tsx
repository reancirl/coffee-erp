import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users, Shield } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface Permission {
    id: number;
    name: string;
}

interface Role {
    id: number;
    name: string;
    permissions: Permission[];
    users_count?: number;
}

interface Props {
    roles: {
        data: Role[];
        links: any[];
        meta: any;
    };
}

export default function RolesIndex({ roles }: Props) {
    const [deleteRole, setDeleteRole] = useState<Role | null>(null);

    const handleDelete = () => {
        if (deleteRole) {
            router.delete(route('roles.destroy', deleteRole.id), {
                onSuccess: () => {
                    setDeleteRole(null);
                },
            });
        }
    };

    return (
        <AppLayout>
            <Head title="Roles Management" />

            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Roles Management</h1>
                        <p className="text-muted-foreground">
                            Manage roles and their permissions
                        </p>
                    </div>
                    <Link href={route('roles.create')}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Role
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {roles.data.map((role) => (
                        <Card key={role.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-semibold flex items-center">
                                    <Shield className="mr-2 h-5 w-5" />
                                    {role.name}
                                </CardTitle>
                                <div className="flex space-x-2">
                                    <Link href={route('roles.edit', role.id)}>
                                        <Button variant="outline" size="sm">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    {role.name !== 'Admin' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setDeleteRole(role)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Users className="mr-2 h-4 w-4" />
                                        {role.users_count || 0} users assigned
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm font-medium mb-2">Permissions:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {role.permissions.slice(0, 3).map((permission) => (
                                                <Badge key={permission.id} variant="secondary" className="text-xs">
                                                    {permission.name.replace('access ', '')}
                                                </Badge>
                                            ))}
                                            {role.permissions.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{role.permissions.length - 3} more
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <Link href={route('roles.show', role.id)}>
                                        <Button variant="ghost" size="sm" className="w-full">
                                            View Details
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {roles.data.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No roles found</h3>
                            <p className="text-muted-foreground mb-4">Get started by creating your first role.</p>
                            <Link href={route('roles.create')}>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Role
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Dialog open={!!deleteRole} onOpenChange={() => setDeleteRole(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the role
                            "{deleteRole?.name}" and remove it from all users.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteRole(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
