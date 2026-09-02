import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { type PropsWithChildren } from 'react';

/**
 * The persistent half of the app chrome.
 *
 * Inertia mounts this once — via `Page.layout = withAppShell` — and keeps it
 * mounted across navigations, so the sidebar holds its scroll position and its
 * open/closed state instead of remounting, and resetting, on every visit.
 *
 * Nothing that varies per page belongs in here; that goes in `AppSidebarLayout`,
 * which each page renders as `<AppLayout>` inside this shell.
 */
export default function AppShellLayout({ children }: PropsWithChildren) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                {children}
            </AppContent>
        </AppShell>
    );
}
