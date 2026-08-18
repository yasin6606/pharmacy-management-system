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
    Sparkles,
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
                <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm">
                        <Sparkles className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                        <h1 className="fantasy-title text-base sm:text-lg font-bold text-[var(--color-foreground)] leading-tight">
                            Arcane Apothecary
                        </h1>
                        <p className="text-[10px] uppercase tracking-widest text-[var(--color-accent)] font-semibold">
                            Pharmacy MS
                        </p>
                    </div>
                </div>
                <p className="text-xs sm:text-sm text-[var(--color-muted-foreground)] mt-2 truncate">
                    {user?.fullName}
                    {user?.role ? ` · ${roleT(user.role)}` : ''}
                </p>
                <div className="fantasy-ornament mt-3" aria-hidden />
            </div>

            <nav className="flex-1 p-2 space-y-1 overflow-y-auto" aria-label="Main">
                {filteredItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.href}
                            href={item.href as any}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all text-xs sm:text-sm',
                                isActive
                                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm'
                                    : 'text-[var(--color-foreground)] hover:bg-[var(--color-secondary)]'
                            )}
                        >
                            <item.icon className="h-5 w-5 flex-shrink-0 opacity-90" aria-hidden />
                            <span>{t(item.labelKey)}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-[var(--color-border)] space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <ThemeToggle />
                    <LanguageSwitcher />
                </div>
                <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-3 py-2 text-xs sm:text-sm text-[var(--color-destructive)] hover:bg-[var(--color-secondary)] rounded-lg transition-colors"
                >
                    <LogOut className="h-5 w-5 flex-shrink-0" aria-hidden />
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
                className="fixed top-4 start-4 z-50 md:hidden shadow-md bg-[var(--color-card)]"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
            >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <aside className="hidden md:flex w-64 fantasy-panel border-e border-[var(--color-border)] h-screen flex-col rounded-none">
                {sidebarContent}
            </aside>

            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden
                />
            )}

            <aside
                className={cn(
                    'fixed top-0 start-0 z-50 h-screen w-64 max-w-[85vw] fantasy-panel border-e border-[var(--color-border)] flex-col transition-transform duration-300 ease-in-out md:hidden',
                    mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
                )}
                aria-hidden={!mobileOpen}
            >
                {sidebarContent}
            </aside>
        </>
    );
}
