import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCog, Plus, Search, Filter, Download, Mail, Phone, MapPin, Calendar, Clock, Shield, Edit, Trash2, Eye } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employee Management',
        href: '/employees',
    },
];

// Mock employee data
const mockEmployeeData = [
    {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@coffeeshop.com',
        phone: '+63 912 345 6789',
        position: 'Manager',
        department: 'Operations',
        status: 'active',
        hireDate: '2024-01-15',
        hourlyRate: 250.00,
        totalHours: 160,
        avatar: null,
        address: '123 Main St, Manila',
        emergencyContact: 'Jane Doe - +63 912 345 6790',
        roles: ['Admin', 'Manager'],
        lastClockIn: '2025-01-04 08:00:00',
        lastClockOut: '2025-01-03 17:00:00'
    },
    {
        id: 2,
        name: 'Maria Santos',
        email: 'maria.santos@coffeeshop.com',
        phone: '+63 912 345 6788',
        position: 'Barista',
        department: 'Front of House',
        status: 'active',
        hireDate: '2024-03-20',
        hourlyRate: 180.00,
        totalHours: 144,
        avatar: null,
        address: '456 Oak Ave, Quezon City',
        emergencyContact: 'Carlos Santos - +63 912 345 6791',
        roles: ['Cashier'],
        lastClockIn: '2025-01-04 09:00:00',
        lastClockOut: '2025-01-03 18:00:00'
    },
    {
        id: 3,
        name: 'Alex Rivera',
        email: 'alex.rivera@coffeeshop.com',
        phone: '+63 912 345 6787',
        position: 'Shift Supervisor',
        department: 'Operations',
        status: 'active',
        hireDate: '2024-02-10',
        hourlyRate: 220.00,
        totalHours: 152,
        avatar: null,
        address: '789 Pine St, Makati',
        emergencyContact: 'Lisa Rivera - +63 912 345 6792',
        roles: ['Supervisor'],
        lastClockIn: '2025-01-04 07:30:00',
        lastClockOut: '2025-01-03 16:30:00'
    },
    {
        id: 4,
        name: 'Sarah Kim',
        email: 'sarah.kim@coffeeshop.com',
        phone: '+63 912 345 6786',
        position: 'Barista',
        department: 'Front of House',
        status: 'on_leave',
        hireDate: '2024-05-01',
        hourlyRate: 180.00,
        totalHours: 120,
        avatar: null,
        address: '321 Elm St, Pasig',
        emergencyContact: 'David Kim - +63 912 345 6793',
        roles: ['Cashier'],
        lastClockIn: '2025-01-02 08:30:00',
        lastClockOut: '2025-01-02 17:30:00'
    }
];

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'active':
            return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
        case 'on_leave':
            return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">On Leave</Badge>;
        case 'inactive':
            return <Badge variant="destructive">Inactive</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

export default function EmployeesIndex() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
    const [isViewEmployeeModalOpen, setIsViewEmployeeModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

    const departments = ['all', 'Operations', 'Front of House', 'Kitchen', 'Management'];
    const statuses = ['all', 'active', 'on_leave', 'inactive'];
    const positions = ['Manager', 'Shift Supervisor', 'Barista', 'Cashier', 'Kitchen Staff'];

    const filteredData = mockEmployeeData.filter(employee => {
        const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            employee.position.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDepartment = selectedDepartment === 'all' || employee.department === selectedDepartment;
        const matchesStatus = selectedStatus === 'all' || employee.status === selectedStatus;
        
        return matchesSearch && matchesDepartment && matchesStatus;
    });

    const totalEmployees = mockEmployeeData.length;
    const activeEmployees = mockEmployeeData.filter(emp => emp.status === 'active').length;
    const onLeaveEmployees = mockEmployeeData.filter(emp => emp.status === 'on_leave').length;
    const totalPayroll = mockEmployeeData.reduce((sum, emp) => sum + (emp.hourlyRate * emp.totalHours), 0);

    const handleViewEmployee = (employee: any) => {
        setSelectedEmployee(employee);
        setIsViewEmployeeModalOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee Management" />
            
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Employee Management</h1>
                        <p className="text-muted-foreground">
                            Manage your team members and their information
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                        <Button 
                            className="flex items-center gap-2"
                            onClick={() => setIsAddEmployeeModalOpen(true)}
                        >
                            <Plus className="w-4 h-4" />
                            Add Employee
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                            <UserCog className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalEmployees}</div>
                            <p className="text-xs text-muted-foreground">
                                All team members
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active</CardTitle>
                            <Shield className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{activeEmployees}</div>
                            <p className="text-xs text-muted-foreground">
                                Currently working
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
                            <Calendar className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{onLeaveEmployees}</div>
                            <p className="text-xs text-muted-foreground">
                                Temporary absence
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
                            <Clock className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₱{totalPayroll.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                Based on hours worked
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search employees..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map(dept => (
                                        <SelectItem key={dept} value={dept}>
                                            {dept === 'all' ? 'All Departments' : dept}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map(status => (
                                        <SelectItem key={status} value={status}>
                                            {status === 'all' ? 'All Status' : 
                                             status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Employee Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Team Members</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Position</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Hire Date</TableHead>
                                        <TableHead>Hourly Rate</TableHead>
                                        <TableHead>Hours (Month)</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.map((employee) => (
                                        <TableRow key={employee.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={employee.avatar} />
                                                        <AvatarFallback>
                                                            {employee.name.split(' ').map(n => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{employee.name}</div>
                                                        <div className="text-sm text-muted-foreground">{employee.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{employee.position}</TableCell>
                                            <TableCell>{employee.department}</TableCell>
                                            <TableCell>{getStatusBadge(employee.status)}</TableCell>
                                            <TableCell>{employee.hireDate}</TableCell>
                                            <TableCell>₱{employee.hourlyRate.toFixed(2)}</TableCell>
                                            <TableCell>{employee.totalHours}h</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewEmployee(employee)}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        View
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Edit className="w-3 h-3" />
                                                        Edit
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Add Employee Modal */}
                <Dialog open={isAddEmployeeModalOpen} onOpenChange={setIsAddEmployeeModalOpen}>
                    <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add New Employee</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" placeholder="Enter full name" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="Enter email address" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" placeholder="Enter phone number" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="position">Position</Label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select position" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {positions.map(pos => (
                                                <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="department">Department</Label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.filter(d => d !== 'all').map(dept => (
                                                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hourlyRate">Hourly Rate (₱)</Label>
                                    <Input id="hourlyRate" type="number" placeholder="Enter hourly rate" />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea id="address" placeholder="Enter complete address" rows={2} />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="emergency">Emergency Contact</Label>
                                <Input id="emergency" placeholder="Name - Phone Number" />
                            </div>
                            
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setIsAddEmployeeModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={() => setIsAddEmployeeModalOpen(false)}>
                                    Add Employee
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* View Employee Modal */}
                <Dialog open={isViewEmployeeModalOpen} onOpenChange={setIsViewEmployeeModalOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Employee Details</DialogTitle>
                        </DialogHeader>
                        {selectedEmployee && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={selectedEmployee.avatar} />
                                        <AvatarFallback className="text-lg">
                                            {selectedEmployee.name.split(' ').map((n: string) => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-lg font-semibold">{selectedEmployee.name}</h3>
                                        <p className="text-muted-foreground">{selectedEmployee.position}</p>
                                        {getStatusBadge(selectedEmployee.status)}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Mail className="w-4 h-4" />
                                            <span className="font-medium">Email</span>
                                        </div>
                                        <p className="text-muted-foreground">{selectedEmployee.email}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Phone className="w-4 h-4" />
                                            <span className="font-medium">Phone</span>
                                        </div>
                                        <p className="text-muted-foreground">{selectedEmployee.phone}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="w-4 h-4" />
                                            <span className="font-medium">Hire Date</span>
                                        </div>
                                        <p className="text-muted-foreground">{selectedEmployee.hireDate}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-4 h-4" />
                                            <span className="font-medium">Hourly Rate</span>
                                        </div>
                                        <p className="text-muted-foreground">₱{selectedEmployee.hourlyRate.toFixed(2)}</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin className="w-4 h-4" />
                                        <span className="font-medium">Address</span>
                                    </div>
                                    <p className="text-muted-foreground text-sm">{selectedEmployee.address}</p>
                                </div>
                                
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Phone className="w-4 h-4" />
                                        <span className="font-medium">Emergency Contact</span>
                                    </div>
                                    <p className="text-muted-foreground text-sm">{selectedEmployee.emergencyContact}</p>
                                </div>
                                
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Shield className="w-4 h-4" />
                                        <span className="font-medium">Roles</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {selectedEmployee.roles.map((role: string) => (
                                            <Badge key={role} variant="outline">{role}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
