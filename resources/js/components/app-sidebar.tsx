import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Calculator, Folder, LayoutGrid, Users, Receipt, FileText, Wallet, Package, FolderOpen, Shield, UserCheck } from 'lucide-react';
import AppLogo from './app-logo';

// Define all possible navigation items with their module mappings
const allNavItems: (NavItem & { module: string })[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
        module: 'dashboard',
    },
    {
        title: 'POS',
        href: '/pos',
        icon: Calculator,
        module: 'pos',
    },
    {
        title: 'Customers',
        href: '/customers',
        icon: Users,
        module: 'customers',
    },
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
        title: 'Orders',
        href: '/orders',
        icon: Receipt,
        module: 'orders',
    },
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
        title: 'Roles',
        href: '/roles',
        icon: Shield,
        module: 'dashboard', // Using dashboard module for admin access
    },
    {
        title: 'User Roles',
        href: '/user-roles',
        icon: UserCheck,
        module: 'dashboard', // Using dashboard module for admin access
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const accessibleModules = auth?.accessibleModules || [];
    
    // Temporary debug - will remove after testing
    console.log('🔍 DEBUG: Auth object:', auth);
    console.log('🔍 DEBUG: Accessible modules:', accessibleModules);
    console.log('🔍 DEBUG: User:', auth?.user);
    
    // Filter navigation items based on user's accessible modules
    const mainNavItems: NavItem[] = allNavItems
        .filter(item => {
            const hasAccess = accessibleModules.includes(item.module);
            console.log(`🔍 ${item.title} (${item.module}): ${hasAccess ? '✅ VISIBLE' : '❌ HIDDEN'}`);
            return hasAccess;
        })
        .map(({ module, ...item }) => item); // Remove module property from final items
    
    console.log('🔍 DEBUG: Final nav items:', mainNavItems.map(item => item.title));

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
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
