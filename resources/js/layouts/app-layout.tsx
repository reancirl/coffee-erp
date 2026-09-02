import AppShellLayout from '@/layouts/app/app-shell-layout';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        {children}
    </AppLayoutTemplate>
);

/**
 * Every page that renders `<AppLayout>` must also declare the shell that holds
 * it, by assigning this at the bottom of the file:
 *
 *     Dashboard.layout = withAppShell;
 *
 * That is what makes Inertia treat the sidebar as a persistent layout. Without
 * it Inertia rebuilds the whole page tree on each visit, remounting the sidebar
 * and throwing away its scroll position — and the page will crash outright,
 * since the header inside `AppLayout` needs the sidebar's context.
 */
export const withAppShell = (page: ReactNode) => <AppShellLayout>{page}</AppShellLayout>;
