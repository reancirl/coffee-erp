import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

/**
 * The per-page half of the app chrome. Rendered inside `AppShellLayout`, which
 * already supplies the sidebar and the content frame around it — so this only
 * adds the parts that change from one page to the next.
 */
export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <>
            <AppSidebarHeader breadcrumbs={breadcrumbs} />
            {children}
        </>
    );
}
