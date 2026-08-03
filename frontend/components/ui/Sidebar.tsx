// components/ui/Sidebar.tsx
'use client';
import {useTranslations} from 'next-intl';
import {Link, usePathname} from '@/navigation';
import {cn} from '@/lib/utils';
import {
    LayoutDashboard, Package, ShoppingCart, BarChart, Users,
    Building2, AlertTriangle, Settings, LogOut, Menu, X, ClipboardList, CreditCard
} from 'lucide-react';
import {useAuth} from '@/context/AuthContext';
import {ThemeToggle} from './ThemeToggle';
import {LanguageSwitcher} from './LanguageSwitcher';
import {useState} from 'react';
import {Button} from './Button';

const navItems = [
    {
        href: '/dashboard',
        labelKey: 'dashboard',
        icon: LayoutDashboard,
        roles: ['junior', 'senior', 'manager', 'accountant']
    },
    {href: '/inventory', labelKey: 'inventory', icon: Package, roles: ['junior', 'senior', 'manager', 'accountant']},
    {href: '/sales', labelKey: 'sales', icon: ShoppingCart, roles: ['junior', 'senior', 'manager', 'accountant']},
    {
        href: '/sales/records',
        labelKey: 'salesRecords',
        icon: ClipboardList,
        roles: ['junior', 'senior', 'manager', 'accountant']
    },
    {
        href: '/credits',
        labelKey: 'credits',
        icon: CreditCard,
        roles: ['manager', 'accountant']
    },
    {href: '/reports', labelKey: 'reports', icon: BarChart, roles: ['manager', 'accountant']},
    {href: '/employees', labelKey: 'employees', icon: Users, roles: ['manager']},
    {href: '/branches', labelKey: 'branches', icon: Building2, roles: ['manager']},
    {
        href: '/loss-reports',
        labelKey: 'lossReports',
        icon: AlertTriangle,
        roles: ['junior', 'senior', 'manager', 'accountant']
    },
    {href: '/settings', labelKey: 'settings', icon: Settings, roles: ['manager', 'accountant']},
];

export function Sidebar() {
    const t = useTranslations('navigation');
    const roleT = useTranslations('roles');
    const authT = useTranslations('auth');
    const pathname = usePathname();
    const {user, logout} = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const filteredItems = navItems.filter(item => item.roles.includes(user?.role || ''));

    const sidebarContent = (
        <>
            {/* Header */}
            <div className="p-4 border-b border-border dark:border-gray-800">
                <h1 className="text-lg sm:text-xl font-bold text-foreground">Pharmacy MS</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                    {user?.fullName} ({user?.role && roleT(user.role)})
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                {filteredItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href as any}   // ✅ bypass strict typing for generic routes
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors text-xs sm:text-sm',
                                isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                        >
                            <item.icon className="h-5 w-5 flex-shrink-0"/>
                            <span>{t(item.labelKey)}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <ThemeToggle/>
                    <LanguageSwitcher/>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-3 py-2 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors"
                >
                    <LogOut className="h-5 w-5 flex-shrink-0"/>
                    <span>{authT('logout')}</span>
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile menu button */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 md:hidden shadow-md"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
                {mobileOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}
            </Button>

            {/* Desktop sidebar */}
            <aside
                className="hidden md:flex w-64 bg-card border-r border-border dark:border-gray-800 h-screen flex-col">
                {sidebarContent}
            </aside>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile sidebar drawer */}
            <aside
                className={cn(
                    'fixed top-0 left-0 z-50 h-screen w-64 max-w-[85vw] bg-card border-r border-border dark:border-gray-800 flex-col transition-transform duration-300 ease-in-out md:hidden',
                    mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
                )}
            >
                {sidebarContent}
            </aside>
        </>
    );
}
