import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Edit, UserPlus, Shield, Search } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { useState } from 'react';

interface Role {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    tenant_id: number | null;
    roles: Role[];
}

interface Props {
    users: {
        data: User[];
        links: any[];
        meta: any;
    };
    roles: Role[];
}

export default function UserRolesIndex({ users, roles }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('');

    const handleQuickAssign = (userId: number, roleId: string) => {
        router.post(route('user-roles.assign-role', userId), {
            role_id: parseInt(roleId),
        });
    };

    const handleQuickRemove = (userId: number, roleId: number) => {
        router.delete(route('user-roles.remove-role', userId), {
            data: { role_id: roleId },
        });
    };

    const filteredUsers = users.data.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AppLayout>
            <Head title="User Roles Management" />

            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">User Roles Management</h1>
                        <p className="text-muted-foreground">
                            Assign and manage user roles and permissions
                        </p>
                    </div>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Search Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Users List */}
                <div className="space-y-4">
                    {filteredUsers.map((user) => (
                        <Card key={user.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                            <Users className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{user.name}</h3>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                            {user.tenant_id === null && (
                                                <Badge variant="secondary" className="mt-1">
                                                    Super Admin
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        {/* Current Roles */}
                                        <div className="flex flex-wrap gap-2">
                                            {user.roles.length > 0 ? (
                                                user.roles.map((role) => (
                                                    <Badge 
                                                        key={role.id} 
                                                        variant="outline" 
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Shield className="h-3 w-3" />
                                                        {role.name}
                                                        <button
                                                            onClick={() => handleQuickRemove(user.id, role.id)}
                                                            className="ml-1 text-destructive hover:text-destructive/80"
                                                            title="Remove role"
                                                        >
                                                            ×
                                                        </button>
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-sm text-muted-foreground">No roles assigned</span>
                                            )}
                                        </div>

                                        {/* Quick Role Assignment */}
                                        <div className="flex items-center space-x-2">
                                            <Select onValueChange={(value) => handleQuickAssign(user.id, value)}>
                                                <SelectTrigger className="w-40">
                                                    <SelectValue placeholder="Assign role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles
                                                        .filter(role => !user.roles.some(userRole => userRole.id === role.id))
                                                        .map((role) => (
                                                            <SelectItem key={role.id} value={role.id.toString()}>
                                                                {role.name}
                                                            </SelectItem>
                                                        ))
                                                    }
                                                </SelectContent>
                                            </Select>

                                            <Link href={route('user-roles.edit', user.id)}>
                                                <Button variant="outline" size="sm">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {filteredUsers.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Users className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No users found</h3>
                            <p className="text-muted-foreground">
                                {searchTerm ? 'No users match your search criteria.' : 'No users available for role assignment.'}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Role Management Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Available Roles</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {roles.map((role) => (
                                <Badge key={role.id} variant="secondary" className="flex items-center gap-1">
                                    <Shield className="h-3 w-3" />
                                    {role.name}
                                </Badge>
                            ))}
                        </div>
                        <div className="mt-4">
                            <Link href={route('roles.index')}>
                                <Button variant="outline">
                                    Manage Roles
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
