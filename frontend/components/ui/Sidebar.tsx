'use client';
import {useTranslations} from 'next-intl';
import {Link, usePathname} from '@/navigation';
import {cn} from '@/lib/utils';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    BarChart,
    Users,
    Building2,
    AlertTriangle,
    Settings,
    LogOut,
    Menu,
    X,
    ClipboardList,
    CreditCard,
    Pill,
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
        roles: ['junior', 'senior', 'manager', 'accountant'],
    },
    {href: '/inventory', labelKey: 'inventory', icon: Package, roles: ['junior', 'senior', 'manager', 'accountant']},
    {href: '/sales', labelKey: 'sales', icon: ShoppingCart, roles: ['junior', 'senior', 'manager', 'accountant']},
    {
        href: '/sales/records',
        labelKey: 'salesRecords',
        icon: ClipboardList,
        roles: ['junior', 'senior', 'manager', 'accountant'],
    },
    {href: '/credits', labelKey: 'credits', icon: CreditCard, roles: ['manager', 'accountant']},
    {href: '/reports', labelKey: 'reports', icon: BarChart, roles: ['manager', 'accountant']},
    {href: '/employees', labelKey: 'employees', icon: Users, roles: ['manager']},
    {href: '/branches', labelKey: 'branches', icon: Building2, roles: ['manager']},
    {
        href: '/loss-reports',
        labelKey: 'lossReports',
        icon: AlertTriangle,
        roles: ['junior', 'senior', 'manager', 'accountant'],
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

    const filteredItems = navItems.filter((item) => item.roles.includes(user?.role || ''));

    const sidebarContent = (
        <>
            <div className="p-4 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                    <span className="glass-chip text-[var(--color-primary)]">
                        <Pill className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                        <h1 className="page-title text-sm sm:text-base text-[var(--color-foreground)] leading-tight truncate">
                            Pharmacy MS
                        </h1>
                        <p className="text-[11px] text-[var(--color-muted-foreground)] truncate">
                            Multi-branch operations
                        </p>
                    </div>
                </div>
                <div className="mt-3 rounded-xl glass-subtle px-3 py-2">
                    <p className="text-xs font-medium text-[var(--color-foreground)] truncate">{user?.fullName}</p>
                    <p className="text-[11px] text-[var(--color-muted-foreground)] truncate">
                        {user?.role ? roleT(user.role) : ''}
                    </p>
                </div>
            </div>

            <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto" aria-label="Main">
                {filteredItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href + '/')) ||
                        (item.href !== '/dashboard' && pathname === item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href as any}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm'
                                    : 'text-[var(--color-foreground)] hover:bg-[var(--color-secondary)]'
                            )}
                        >
                            <item.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 opacity-90" aria-hidden />
                            <span className="truncate">{t(item.labelKey)}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-3 border-t border-[var(--color-border)] space-y-2">
                <div className="flex items-center justify-between gap-2 px-1">
                    <ThemeToggle />
                    <LanguageSwitcher />
                </div>
                <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-3 py-2 text-xs sm:text-sm rounded-xl text-[var(--color-destructive)] hover:bg-[var(--color-secondary)] transition-colors"
                >
                    <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden />
                    <span>{authT('logout')}</span>
                </button>
            </div>
        </>
    );

    return (
        <>
            <Button
                variant="outline"
                size="icon"
                className="fixed top-3 start-3 z-50 md:hidden glass-strong"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
            >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <aside className="hidden md:flex w-60 lg:w-64 glass-strong border-e border-[var(--color-border)] h-screen flex-col rounded-none">
                {sidebarContent}
            </aside>

            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden
                />
            )}

            <aside
                className={cn(
                    'fixed top-0 start-0 z-50 h-screen w-64 max-w-[85vw] glass-strong border-e border-[var(--color-border)] flex-col transition-transform duration-300 ease-in-out md:hidden',
                    mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
                )}
                aria-hidden={!mobileOpen}
            >
                {sidebarContent}
            </aside>
        </>
    );
}
