import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Calculator, Folder, LayoutGrid, Users, Receipt, FileText, Wallet, Package, FolderOpen, Shield, UserCheck, ChefHat, Archive, Clock, Calendar, UserCog, Truck, ShoppingCart, ClipboardList, TrendingUp, CalendarRange, CalendarX2, Banknote } from 'lucide-react';
import AppLogo from './app-logo';

// Define navigation groups with their items
interface NavGroup {
    title: string;
    items: (NavItem & { module: string })[];
}

const navigationGroups: NavGroup[] = [
    {
        title: 'Overview',
        items: [
            {
                title: 'Dashboard',
                href: '/dashboard',
                icon: LayoutGrid,
                module: 'dashboard',
            },
        ]
    },
    {
        title: 'Operations',
        items: [
            {
                title: 'POS',
                href: '/pos',
                icon: Calculator,
                module: 'pos',
            },
            {
                title: 'Kitchen Queue',
                href: '/kitchen-queue',
                icon: ChefHat,
                module: 'pos',
            },
            {
                title: 'Orders',
                href: '/orders',
                icon: Receipt,
                module: 'orders',
            },
            {
                title: 'Time Clock',
                href: '/time-clock',
                icon: Clock,
                module: 'dashboard', // All employees can access time clock
            },
        ]
    },
    {
        title: 'Events & Catering',
        items: [
            {
                title: 'Event Bookings',
                href: '/event-bookings',
                icon: CalendarRange,
                module: 'event-booking',
            },
            {
                title: 'Event Packages',
                href: '/event-packages',
                icon: Package,
                module: 'event-booking',
            },
            {
                title: 'Blocked Dates',
                href: '/event-unavailable-dates',
                icon: CalendarX2,
                module: 'event-booking',
            },
        ]
    },
    {
        title: 'Inventory & Products',
        items: [
            {
                title: 'Categories',
                href: '/categories',
                icon: FolderOpen,
                module: 'categories',
            },
            {
                title: 'Products',
                href: '/products',
                icon: Package,
                module: 'products',
            },
            {
                title: 'Inventory',
                href: '/inventory',
                icon: Archive,
                module: 'products',
            },
        ]
    },
    {
        title: 'Supplier Management',
        items: [
            {
                title: 'Suppliers',
                href: '/suppliers',
                icon: Truck,
                module: 'products',
            },
            {
                title: 'Purchase Orders',
                href: '/purchase-orders',
                icon: ShoppingCart,
                module: 'products',
            },
            {
                title: 'Receiving',
                href: '/receiving',
                icon: ClipboardList,
                module: 'products',
            },
        ]
    },
    {
        title: 'Customer Management',
        items: [
            {
                title: 'Customers',
                href: '/customers',
                icon: Users,
                module: 'customers',
            },
        ]
    },
    {
        title: 'Staff Management',
        items: [
            {
                title: 'Employees',
                href: '/employees',
                icon: UserCog,
                module: 'sales-monitoring',
            },
            {
                title: 'Shift Management',
                href: '/shifts',
                icon: Calendar,
                module: 'sales-monitoring',
            },
        ]
    },
    {
        title: 'Analytics & Reports',
        items: [
            {
                title: 'Reports',
                href: '/reports/z-report',
                icon: FileText,
                module: 'reports',
            },
            {
                title: 'Sales Monitoring',
                href: '/sales-monitoring',
                icon: Wallet,
                module: 'sales-monitoring',
            },
            {
                title: 'Supplier Performance',
                href: '/supplier-performance',
                icon: TrendingUp,
                module: 'sales-monitoring',
            },
        ]
    },
    {
        title: 'Finance',
        items: [
            {
                title: 'Remittances',
                href: '/sales-monitoring#remittances',
                icon: Banknote,
                module: 'sales-monitoring',
            },
            {
                title: 'Expenses',
                href: '/expenses',
                icon: Receipt,
                module: 'sales-monitoring',
            },
            {
                title: 'Payroll',
                href: '/payroll',
                icon: Wallet,
                module: 'sales-monitoring',
            },
            {
                title: 'Cash Reconciliation',
                href: '/cash-reconciliation',
                icon: Calculator,
                module: 'sales-monitoring',
            },
        ],
    },
    {
        title: 'System Administration',
        items: [
            {
                title: 'Roles',
                href: '/roles',
                icon: Shield,
                module: 'sales-monitoring',
            },
            {
                title: 'User Roles',
                href: '/user-roles',
                icon: UserCheck,
                module: 'sales-monitoring',
            },
        ]
    }
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const accessibleModules = auth?.accessibleModules || [];
    
    // Filter navigation groups and items based on user's accessible modules
    const filteredGroups = navigationGroups
        .map(group => ({
            ...group,
            items: group.items
                .filter(item => accessibleModules.includes(item.module))
                .map(({ module, ...item }) => item) // Remove module property from final items
        }))
        .filter(group => group.items.length > 0); // Only show groups that have accessible items
    
    // Flatten all items for the NavMain component (it expects a flat array)
    const mainNavItems: NavItem[] = filteredGroups.flatMap(group => group.items);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={filteredGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
