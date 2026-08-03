'use client';
import {Sidebar} from '@/components/ui/Sidebar';
import {useAuth} from '@/context/AuthContext';
import {redirect} from '@/navigation';
import {Spinner} from '@/components/ui/Spinner';
import {useLocale} from 'next-intl';
import {SalesTabsProvider} from "@/context/SalesTabsContext";

export default function DashboardLayout({children}: { children: React.ReactNode }) {
    const locale = useLocale();
    const {user, loading} = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Spinner size="lg"/>
            </div>
        );
    }
    if (!user) redirect({href: '/login', locale});

    return (
        <SalesTabsProvider>
            <div className="flex h-screen bg-background">
                <Sidebar/>
                {/* pt-16 on mobile to clear the fixed hamburger, reset to md:pt-6 on desktop */}
                <main className="flex-1 overflow-auto p-4 pt-16 md:p-6 md:pt-6">
                    {children}
                </main>
            </div>
        </SalesTabsProvider>
    );
}
