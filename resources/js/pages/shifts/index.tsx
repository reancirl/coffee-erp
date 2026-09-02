import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Plus, Search, Filter, Download, Clock, Users, CalendarDays, Edit, Trash2, Eye, AlertCircle, CheckCircle, UserCheck } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Shift Management',
        href: '/shifts',
    },
];

// Mock shift data
const mockShiftData = [
    {
        id: 1,
        title: 'Morning Shift',
        date: '2025-01-04',
        startTime: '08:00',
        endTime: '16:00',
        employees: [
            { id: 1, name: 'John Doe', position: 'Manager', status: 'confirmed' },
            { id: 2, name: 'Maria Santos', position: 'Barista', status: 'confirmed' },
            { id: 3, name: 'Alex Rivera', position: 'Shift Supervisor', status: 'confirmed' }
        ],
        status: 'scheduled',
        notes: 'Regular morning shift',
        requiredPositions: {
            'Manager': 1,
            'Barista': 2,
            'Cashier': 1
        }
    },
    {
        id: 2,
        title: 'Afternoon Shift',
        date: '2025-01-04',
        startTime: '14:00',
        endTime: '22:00',
        employees: [
            { id: 4, name: 'Sarah Kim', position: 'Barista', status: 'pending' },
            { id: 5, name: 'Mike Johnson', position: 'Cashier', status: 'confirmed' }
        ],
        status: 'understaffed',
        notes: 'Need one more barista',
        requiredPositions: {
            'Supervisor': 1,
            'Barista': 2,
            'Cashier': 1
        }
    },
    {
        id: 3,
        title: 'Weekend Morning',
        date: '2025-01-05',
        startTime: '07:00',
        endTime: '15:00',
        employees: [
            { id: 1, name: 'John Doe', position: 'Manager', status: 'confirmed' },
            { id: 6, name: 'Lisa Wong', position: 'Barista', status: 'confirmed' },
            { id: 7, name: 'Carlos Mendez', position: 'Barista', status: 'confirmed' }
        ],
        status: 'fully_staffed',
        notes: 'Weekend rush preparation',
        requiredPositions: {
            'Manager': 1,
            'Barista': 2,
            'Cashier': 1
        }
    },
    {
        id: 4,
        title: 'Night Shift',
        date: '2025-01-04',
        startTime: '22:00',
        endTime: '06:00',
        employees: [
            { id: 8, name: 'David Park', position: 'Night Supervisor', status: 'confirmed' },
            { id: 9, name: 'Emma Chen', position: 'Barista', status: 'confirmed' }
        ],
        status: 'scheduled',
        notes: 'Closing and prep for next day',
        requiredPositions: {
            'Supervisor': 1,
            'Barista': 1,
            'Cleaner': 1
        }
    }
];

// Mock available employees
const availableEmployees = [
    { id: 1, name: 'John Doe', position: 'Manager', avatar: null },
    { id: 2, name: 'Maria Santos', position: 'Barista', avatar: null },
    { id: 3, name: 'Alex Rivera', position: 'Shift Supervisor', avatar: null },
    { id: 4, name: 'Sarah Kim', position: 'Barista', avatar: null },
    { id: 5, name: 'Mike Johnson', position: 'Cashier', avatar: null },
    { id: 6, name: 'Lisa Wong', position: 'Barista', avatar: null },
    { id: 7, name: 'Carlos Mendez', position: 'Barista', avatar: null },
    { id: 8, name: 'David Park', position: 'Night Supervisor', avatar: null },
    { id: 9, name: 'Emma Chen', position: 'Barista', avatar: null }
];

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'scheduled':
            return <Badge variant="default" className="bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300">Scheduled</Badge>;
        case 'fully_staffed':
            return <Badge variant="default" className="bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />Fully Staffed
            </Badge>;
        case 'understaffed':
            return <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />Understaffed
            </Badge>;
        case 'completed':
            return <Badge variant="secondary">Completed</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

const getEmployeeStatusBadge = (status: string) => {
    switch (status) {
        case 'confirmed':
            return <Badge variant="default" className="bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300">Confirmed</Badge>;
        case 'pending':
            return <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300">Pending</Badge>;
        case 'declined':
            return <Badge variant="destructive">Declined</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

export default function ShiftsIndex() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [isCreateShiftModalOpen, setIsCreateShiftModalOpen] = useState(false);
    const [isViewShiftModalOpen, setIsViewShiftModalOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<any>(null);

    const statuses = ['all', 'scheduled', 'fully_staffed', 'understaffed', 'completed'];
    const positions = ['Manager', 'Shift Supervisor', 'Barista', 'Cashier', 'Kitchen Staff', 'Cleaner'];

    const filteredData = mockShiftData.filter(shift => {
        const matchesSearch = shift.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            shift.employees.some(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesDate = selectedDate === 'all' || shift.date === selectedDate;
        const matchesStatus = selectedStatus === 'all' || shift.status === selectedStatus;
        
        return matchesSearch && matchesDate && matchesStatus;
    });

    const totalShifts = mockShiftData.length;
    const fullyStaffedShifts = mockShiftData.filter(shift => shift.status === 'fully_staffed').length;
    const understaffedShifts = mockShiftData.filter(shift => shift.status === 'understaffed').length;
    const totalEmployeesScheduled = mockShiftData.reduce((sum, shift) => sum + shift.employees.length, 0);

    const handleViewShift = (shift: any) => {
        setSelectedShift(shift);
        setIsViewShiftModalOpen(true);
    };

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Shift Management" />
            
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Shift Management</h1>
                        <p className="text-muted-foreground">
                            Schedule and manage employee shifts
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Export Schedule
                        </Button>
                        <Button 
                            className="flex items-center gap-2"
                            onClick={() => setIsCreateShiftModalOpen(true)}
                        >
                            <Plus className="w-4 h-4" />
                            Create Shift
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalShifts}</div>
                            <p className="text-xs text-muted-foreground">
                                Scheduled shifts
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Fully Staffed</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{fullyStaffedShifts}</div>
                            <p className="text-xs text-muted-foreground">
                                Ready to go
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Understaffed</CardTitle>
                            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{understaffedShifts}</div>
                            <p className="text-xs text-muted-foreground">
                                Need attention
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Scheduled</CardTitle>
                            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalEmployeesScheduled}</div>
                            <p className="text-xs text-muted-foreground">
                                Employee assignments
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
                                        placeholder="Search shifts or employees..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Input
                                type="date"
                                value={selectedDate === 'all' ? '' : selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value || 'all')}
                                className="w-full sm:w-[180px]"
                            />
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

                {/* Shifts Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Scheduled Shifts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Shift</TableHead>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Assigned Staff</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Required Positions</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.map((shift) => (
                                        <TableRow key={shift.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{shift.title}</div>
                                                    {shift.notes && (
                                                        <div className="text-sm text-muted-foreground">{shift.notes}</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{shift.date}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    {shift.employees.slice(0, 2).map((employee) => (
                                                        <div key={employee.id} className="flex items-center gap-2">
                                                            <Avatar className="h-6 w-6">
                                                                <AvatarFallback className="text-xs">
                                                                    {employee.name.split(' ').map(n => n[0]).join('')}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-sm">{employee.name}</span>
                                                            {getEmployeeStatusBadge(employee.status)}
                                                        </div>
                                                    ))}
                                                    {shift.employees.length > 2 && (
                                                        <div className="text-sm text-muted-foreground">
                                                            +{shift.employees.length - 2} more
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(shift.status)}</TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {Object.entries(shift.requiredPositions).map(([position, count]) => (
                                                        <div key={position}>
                                                            {position}: {count}
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewShift(shift)}
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

                {/* Create Shift Modal */}
                <Dialog open={isCreateShiftModalOpen} onOpenChange={setIsCreateShiftModalOpen}>
                    <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create New Shift</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="shift-title">Shift Title</Label>
                                    <Input id="shift-title" placeholder="e.g., Morning Shift" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="shift-date">Date</Label>
                                    <Input id="shift-date" type="date" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start-time">Start Time</Label>
                                    <Input id="start-time" type="time" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end-time">End Time</Label>
                                    <Input id="end-time" type="time" />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Required Positions</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    {positions.map(position => (
                                        <div key={position} className="flex items-center gap-2">
                                            <Label className="flex-1">{position}</Label>
                                            <Input 
                                                type="number" 
                                                min="0" 
                                                max="10" 
                                                defaultValue="0"
                                                className="w-16"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Assign Employees</Label>
                                <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                                    {availableEmployees.map(employee => (
                                        <div key={employee.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded">
                                            <input type="checkbox" id={`emp-${employee.id}`} />
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback className="text-xs">
                                                    {employee.name.split(' ').map(n => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <Label htmlFor={`emp-${employee.id}`} className="flex-1 cursor-pointer">
                                                {employee.name} - {employee.position}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="shift-notes">Notes</Label>
                                <Textarea id="shift-notes" placeholder="Any additional notes for this shift..." rows={3} />
                            </div>
                            
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setIsCreateShiftModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={() => setIsCreateShiftModalOpen(false)}>
                                    Create Shift
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* View Shift Modal */}
                <Dialog open={isViewShiftModalOpen} onOpenChange={setIsViewShiftModalOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Shift Details</DialogTitle>
                        </DialogHeader>
                        {selectedShift && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold">{selectedShift.title}</h3>
                                        <p className="text-muted-foreground">
                                            {selectedShift.date} • {formatTime(selectedShift.startTime)} - {formatTime(selectedShift.endTime)}
                                        </p>
                                    </div>
                                    {getStatusBadge(selectedShift.status)}
                                </div>
                                
                                <div>
                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Assigned Staff ({selectedShift.employees.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedShift.employees.map((employee: any) => (
                                            <div key={employee.id} className="flex items-center justify-between p-2 bg-muted rounded">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback>
                                                            {employee.name.split(' ').map((n: string) => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{employee.name}</div>
                                                        <div className="text-sm text-muted-foreground">{employee.position}</div>
                                                    </div>
                                                </div>
                                                {getEmployeeStatusBadge(employee.status)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                        <UserCheck className="w-4 h-4" />
                                        Required Positions
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(selectedShift.requiredPositions).map(([position, count]) => (
                                            <div key={position} className="flex justify-between p-2 bg-muted rounded text-sm">
                                                <span>{position}</span>
                                                <span className="font-medium">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                {selectedShift.notes && (
                                    <div>
                                        <h4 className="font-medium mb-2">Notes</h4>
                                        <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                                            {selectedShift.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
