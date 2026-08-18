'use client';
import {Sidebar} from '@/components/ui/Sidebar';
import {useAuth} from '@/context/AuthContext';
import {redirect} from '@/navigation';
import {Spinner} from '@/components/ui/Spinner';
import {useLocale} from 'next-intl';
import {SalesTabsProvider} from '@/context/SalesTabsContext';

export default function DashboardLayout({children}: {children: React.ReactNode}) {
    const locale = useLocale();
    const {user, loading} = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[var(--color-background)]">
                <div className="flex flex-col items-center gap-3">
                    <Spinner size="lg" />
                    <p className="text-sm text-[var(--color-muted-foreground)]">Opening the apothecary…</p>
                </div>
            </div>
        );
    }
    if (!user) redirect({href: '/login', locale});

    return (
        <SalesTabsProvider>
            <div className="flex h-screen bg-[var(--color-background)]">
                <Sidebar />
                <main className="flex-1 overflow-auto p-4 pt-16 md:p-6 md:pt-6">
                    <div className="mx-auto max-w-7xl">{children}</div>
                </main>
            </div>
        </SalesTabsProvider>
    );
}
