import { Link, router } from '@inertiajs/react';
import { LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type NavItem = {
    name: string;
    href: string;
    icon: React.ReactNode;
    active?: boolean;
};

type AppNavProps = {
    user: {
        name: string;
        email: string;
        role: string;
        is_admin: boolean;
        is_seller: boolean;
        is_buyer: boolean;
    };
    currentRoute: string;
};

export default function AppNav({ user, currentRoute }: AppNavProps) {
    // Common navigation items
    const commonNavItems: NavItem[] = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: <LayoutDashboard className="h-5 w-5" />,
            active: currentRoute === 'dashboard',
        },
    ];

    // Admin navigation items
    const adminNavItems: NavItem[] = [
        {
            name: 'Users',
            href: '/admin/users',
            icon: <Users className="h-5 w-5" />,
            active: currentRoute.startsWith('admin/users'),
        },
        {
            name: 'Settings',
            href: '/admin/settings',
            icon: <Settings className="h-5 w-5" />,
            active: currentRoute.startsWith('admin/settings'),
        },
    ];

    // Seller navigation items
    const sellerNavItems: NavItem[] = [
        {
            name: 'Products',
            href: '/seller/products',
            icon: <Package className="h-5 w-5" />,
            active: currentRoute.startsWith('seller/products'),
        },
        {
            name: 'Orders',
            href: '/seller/orders',
            icon: <ShoppingCart className="h-5 w-5" />,
            active: currentRoute.startsWith('seller/orders'),
        },
    ];

    // Buyer navigation items
    const buyerNavItems: NavItem[] = [
        {
            name: 'My Orders',
            href: '/buyer/orders',
            icon: <ShoppingCart className="h-5 w-5" />,
            active: currentRoute.startsWith('buyer/orders'),
        },
        {
            name: 'Wishlist',
            href: '/buyer/wishlist',
            icon: <Package className="h-5 w-5" />,
            active: currentRoute.startsWith('buyer/wishlist'),
        },
    ];

    // Combine navigation items based on user role
    let navItems = [...commonNavItems];
    if (user.is_admin) {
        navItems = [...navItems, ...adminNavItems];
    }
    if (user.is_seller) {
        navItems = [...navItems, ...sellerNavItems];
    }
    if (user.is_buyer) {
        navItems = [...navItems, ...buyerNavItems];
    }

    const handleLogout = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(route('logout'));
    };

    return (
        <nav className="flex flex-col h-full">
            <div className="flex-1 space-y-1">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'flex items-center px-4 py-2 text-sm font-medium rounded-md',
                            item.active
                                ? 'bg-accent text-accent-foreground'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        )}
                    >
                        <span className="mr-3">{item.icon}</span>
                        {item.name}
                    </Link>
                ))}
            </div>
            <div className="mt-auto pt-4 border-t">
                <form onSubmit={handleLogout}>
                    <Button
                        variant="ghost"
                        className="w-full justify-start"
                        type="submit"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                    </Button>
                </form>
            </div>
        </nav>
    );
}
