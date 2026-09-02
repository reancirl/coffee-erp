import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, LogIn, LogOut, Calendar, Timer, User, AlertCircle, CheckCircle, Coffee, MapPin } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Time Clock',
        href: '/time-clock',
    },
];

// Mock current user data
const currentUser = {
    id: 1,
    name: 'John Doe',
    position: 'Manager',
    avatar: null,
    isClocked: false,
    lastClockIn: null,
    lastClockOut: '2025-01-03 17:00:00',
    todayHours: 0,
    weekHours: 32.5
};

// Mock time entries for today
const mockTimeEntries = [
    {
        id: 1,
        employeeName: 'John Doe',
        position: 'Manager',
        clockIn: '2025-01-04 08:00:00',
        clockOut: null,
        status: 'clocked_in',
        totalHours: 2.5,
        avatar: null
    },
    {
        id: 2,
        employeeName: 'Maria Santos',
        position: 'Barista',
        clockIn: '2025-01-04 09:00:00',
        clockOut: null,
        status: 'clocked_in',
        totalHours: 1.5,
        avatar: null
    },
    {
        id: 3,
        employeeName: 'Alex Rivera',
        position: 'Shift Supervisor',
        clockIn: '2025-01-04 07:30:00',
        clockOut: '2025-01-04 16:30:00',
        status: 'clocked_out',
        totalHours: 9.0,
        avatar: null
    },
    {
        id: 4,
        employeeName: 'Sarah Kim',
        position: 'Barista',
        clockIn: '2025-01-04 08:30:00',
        clockOut: '2025-01-04 17:30:00',
        status: 'clocked_out',
        totalHours: 9.0,
        avatar: null
    }
];

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'clocked_in':
            return <Badge variant="default" className="bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />Clocked In
            </Badge>;
        case 'clocked_out':
            return <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />Clocked Out
            </Badge>;
        case 'break':
            return <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 flex items-center gap-1">
                <Coffee className="w-3 h-3" />On Break
            </Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

export default function TimeClockIndex() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isClockModalOpen, setIsClockModalOpen] = useState(false);
    const [clockAction, setClockAction] = useState<'in' | 'out' | 'break'>('in');
    const [notes, setNotes] = useState('');
    const [userStatus, setUserStatus] = useState(currentUser);

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleClockAction = (action: 'in' | 'out' | 'break') => {
        setClockAction(action);
        setIsClockModalOpen(true);
        setNotes('');
    };

    const submitClockAction = () => {
        // Here you would normally submit to backend
        console.log('Clock action submitted:', {
            action: clockAction,
            time: currentTime,
            notes: notes
        });
        
        // Update user status (mock)
        if (clockAction === 'in') {
            setUserStatus(prev => ({
                ...prev,
                isClocked: true,
                lastClockIn: currentTime.toISOString()
            }));
        } else if (clockAction === 'out') {
            setUserStatus(prev => ({
                ...prev,
                isClocked: false,
                lastClockOut: currentTime.toISOString()
            }));
        }
        
        setIsClockModalOpen(false);
    };

    const clockedInEmployees = mockTimeEntries.filter(entry => entry.status === 'clocked_in').length;
    const totalHoursToday = mockTimeEntries.reduce((sum, entry) => sum + entry.totalHours, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Time Clock" />
            
            <div className="space-y-6 p-6">
                {/* Header with Current Time */}
                <div className="text-center space-y-2">
                    <div className="text-6xl font-bold text-primary">
                        {formatTime(currentTime)}
                    </div>
                    <div className="text-xl text-muted-foreground">
                        {formatDate(currentTime)}
                    </div>
                </div>

                {/* User Status Card */}
                <Card className="max-w-md mx-auto">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4 mb-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={userStatus.avatar} />
                                <AvatarFallback className="text-lg">
                                    {userStatus.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="text-lg font-semibold">{userStatus.name}</h3>
                                <p className="text-muted-foreground">{userStatus.position}</p>
                                {userStatus.isClocked ? (
                                    <Badge variant="default" className="bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300">
                                        Currently Clocked In
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary">Clocked Out</Badge>
                                )}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div>
                                <div className="font-medium">Today's Hours</div>
                                <div className="text-2xl font-bold text-primary">{userStatus.todayHours}h</div>
                            </div>
                            <div>
                                <div className="font-medium">Week's Hours</div>
                                <div className="text-2xl font-bold text-primary">{userStatus.weekHours}h</div>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            {!userStatus.isClocked ? (
                                <Button 
                                    className="flex-1 flex items-center gap-2"
                                    onClick={() => handleClockAction('in')}
                                >
                                    <LogIn className="w-4 h-4" />
                                    Clock In
                                </Button>
                            ) : (
                                <>
                                    <Button 
                                        variant="outline"
                                        className="flex-1 flex items-center gap-2"
                                        onClick={() => handleClockAction('break')}
                                    >
                                        <Coffee className="w-4 h-4" />
                                        Break
                                    </Button>
                                    <Button 
                                        variant="destructive"
                                        className="flex-1 flex items-center gap-2"
                                        onClick={() => handleClockAction('out')}
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Clock Out
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Currently Clocked In</CardTitle>
                            <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{clockedInEmployees}</div>
                            <p className="text-xs text-muted-foreground">
                                Active employees
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Hours Today</CardTitle>
                            <Timer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalHoursToday}h</div>
                            <p className="text-xs text-muted-foreground">
                                All employees combined
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Average Hours</CardTitle>
                            <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{(totalHoursToday / mockTimeEntries.length).toFixed(1)}h</div>
                            <p className="text-xs text-muted-foreground">
                                Per employee today
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Today's Time Entries */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Today's Time Entries
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Clock In</TableHead>
                                        <TableHead>Clock Out</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Hours Worked</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockTimeEntries.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={entry.avatar} />
                                                        <AvatarFallback>
                                                            {entry.employeeName.split(' ').map(n => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{entry.employeeName}</div>
                                                        <div className="text-sm text-muted-foreground">{entry.position}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <LogIn className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                    {new Date(entry.clockIn).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {entry.clockOut ? (
                                                    <div className="flex items-center gap-2">
                                                        <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                        {new Date(entry.clockOut).toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">Still working</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(entry.status)}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{entry.totalHours}h</div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Clock Action Modal */}
                <Dialog open={isClockModalOpen} onOpenChange={setIsClockModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                {clockAction === 'in' && <LogIn className="w-5 h-5 text-green-600 dark:text-green-400" />}
                                {clockAction === 'out' && <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />}
                                {clockAction === 'break' && <Coffee className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />}
                                {clockAction === 'in' ? 'Clock In' : clockAction === 'out' ? 'Clock Out' : 'Start Break'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-primary mb-2">
                                    {formatTime(currentTime)}
                                </div>
                                <div className="text-muted-foreground">
                                    {formatDate(currentTime)}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={userStatus.avatar} />
                                    <AvatarFallback>
                                        {userStatus.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">{userStatus.name}</div>
                                    <div className="text-sm text-muted-foreground">{userStatus.position}</div>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes (Optional)</Label>
                                <Input
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add any notes about this time entry..."
                                />
                            </div>
                            
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setIsClockModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={submitClockAction}
                                    className={
                                        clockAction === 'in' ? 'bg-green-600 hover:bg-green-700' :
                                        clockAction === 'out' ? 'bg-red-600 hover:bg-red-700' :
                                        'bg-yellow-600 hover:bg-yellow-700'
                                    }
                                >
                                    Confirm {clockAction === 'in' ? 'Clock In' : clockAction === 'out' ? 'Clock Out' : 'Start Break'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
