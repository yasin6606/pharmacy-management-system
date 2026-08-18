'use client';
import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {useAuth} from '@/context/AuthContext';
import {useApi} from '@/hooks/useAPI';
import {useRole} from '@/hooks/useRole';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/Card';
import {Button} from '@/components/ui/Button';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/Table';
import {Spinner} from '@/components/ui/Spinner';
import {useRouter} from '@/navigation';
import {
    Package,
    ShoppingCart,
    AlertTriangle,
    FileText,
    ArrowRightLeft,
    DollarSign,
    Users,
} from 'lucide-react';
import {DrugBatch, LossReport, PaginatedResponse, Sale} from '@/types';
import {cn} from '@/lib/utils';

type CatalogStats = {totalDrugs: number; totalBatches: number; totalUnits: number};
type SalesSummary = {totalRevenue: number; transactionCount: number};

export default function DashboardPage() {
    const t = useTranslations('dashboard');
    const commonT = useTranslations('common');
    const {user} = useAuth();
    const {canAdjustStock} = useRole();
    const {get} = useApi();
    const router = useRouter();

    const [stats, setStats] = useState({
        totalDrugs: 0,
        todaySales: 0,
        todayTransactions: 0,
        expiringSoon: 0,
        lowStock: 0,
        pendingLoss: 0,
    });
    const [recentSales, setRecentSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const branchId = user?.currentBranchId;
            const today = new Date().toISOString().split('T')[0];

            // Catalog total — dedicated stats (not limited by page size)
            const catalog = await get<CatalogStats>('/inventory/catalog/stats');
            const totalDrugs = catalog?.totalDrugs ?? 0;

            // Today's revenue — SQL SUM, not sum of a single page of rows
            const summary = await get<SalesSummary>('/sales/summary', {
                params: {startDate: today, endDate: today},
            });
            const todaySales = Number(summary?.totalRevenue ?? 0);
            const todayTransactions = Number(summary?.transactionCount ?? 0);

            let batches: DrugBatch[] = [];
            if (branchId) {
                batches = (await get<DrugBatch[]>(`/inventory/branches/${branchId}/inventory`)) || [];
            }

            const lossRes = await get<PaginatedResponse<LossReport>>('/loss-reports', {
                params: {status: 'pending', limit: 1},
            });
            const pendingLoss = lossRes?.total || 0;

            const now = Date.now();
            const thirtyDays = 30 * 24 * 60 * 60 * 1000;
            const expiringSoon = batches.filter((b) => {
                const exp = new Date(b.expirationDate).getTime();
                return exp - now <= thirtyDays && exp > now && b.count > 0;
            }).length;
            const lowStock = batches.filter((b) => b.count > 0 && b.count < 10).length;

            const recentRes = await get<PaginatedResponse<Sale>>('/sales', {params: {limit: 5}});
            const recent = recentRes?.items || [];

            setStats({
                totalDrugs,
                todaySales,
                todayTransactions,
                expiringSoon,
                lowStock,
                pendingLoss,
            });
            setRecentSales(recent);
        } catch {
            // toast via useApi
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) loadDashboardData();
    }, [user]);

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="glass rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="page-title text-xl sm:text-2xl text-[var(--color-foreground)]">
                        {t('welcome')}, {user?.fullName}
                    </h1>
                    <p className="text-[var(--color-muted-foreground)] text-xs sm:text-sm mt-0.5">
                        {new Date().toLocaleDateString(undefined, {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {canAdjustStock && (
                        <Button size="sm" onClick={() => router.push('/inventory')}>
                            <Package className="h-4 w-4" />
                            {t('manageInventory')}
                        </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => router.push('/sales')}>
                        <ShoppingCart className="h-4 w-4" />
                        {t('newSale')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                <StatsCard title={t('totalDrugs')} value={stats.totalDrugs} icon={<Package className="h-4 w-4" />} />
                <StatsCard
                    title={t('todaySales')}
                    value={`$${stats.todaySales.toFixed(2)}`}
                    subtitle={`${stats.todayTransactions} ${t('transactions')}`}
                    icon={<DollarSign className="h-4 w-4" />}
                    tone="success"
                />
                <StatsCard
                    title={t('expiringSoon')}
                    value={stats.expiringSoon}
                    icon={<AlertTriangle className="h-4 w-4" />}
                    tone={stats.expiringSoon > 0 ? 'warning' : 'default'}
                />
                <StatsCard
                    title={t('lowStock')}
                    value={stats.lowStock}
                    icon={<ArrowRightLeft className="h-4 w-4" />}
                    tone={stats.lowStock > 0 ? 'danger' : 'default'}
                />
                <StatsCard
                    title={t('pendingLoss')}
                    value={stats.pendingLoss}
                    icon={<FileText className="h-4 w-4" />}
                    tone={stats.pendingLoss > 0 ? 'info' : 'default'}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle>{t('recentSales')}</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => router.push('/sales/records')}>
                            {t('viewAll')}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {recentSales.length === 0 ? (
                            <p className="text-center text-[var(--color-muted-foreground)] py-10 text-sm">
                                {t('noSales')}
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{commonT('date')}</TableHead>
                                        <TableHead>{t('drug')}</TableHead>
                                        <TableHead>{t('quantity')}</TableHead>
                                        <TableHead className="text-end">{t('total')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentSales.map((sale) => (
                                        <TableRow key={sale.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {new Date(sale.soldDate).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {sale.drugBatch?.drug?.name || '—'}
                                            </TableCell>
                                            <TableCell>{sale.quantity}</TableCell>
                                            <TableCell className="text-end font-semibold tabular-nums">
                                                ${Number(sale.totalPrice).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('quickActions')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/sales')}>
                            <ShoppingCart className="h-4 w-4" />
                            {t('newSale')}
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => router.push('/loss-reports')}
                        >
                            <AlertTriangle className="h-4 w-4" />
                            {t('reportLoss')}
                        </Button>
                        {canAdjustStock && (
                            <>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => router.push('/inventory')}
                                >
                                    <Package className="h-4 w-4" />
                                    {t('manageInventory')}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => router.push('/employees')}
                                >
                                    <Users className="h-4 w-4" />
                                    {t('manageEmployees')}
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

interface StatsCardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: React.ReactNode;
    tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

function StatsCard({title, value, subtitle, icon, tone = 'default'}: StatsCardProps) {
    const toneClass =
        tone === 'warning'
            ? 'ring-1 ring-amber-500/30'
            : tone === 'danger'
              ? 'ring-1 ring-red-500/30'
              : tone === 'info'
                ? 'ring-1 ring-sky-500/30'
                : tone === 'success'
                  ? 'ring-1 ring-emerald-500/25'
                  : '';

    return (
        <Card className={cn('transition-shadow hover:shadow-md', toneClass)}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
                <CardTitle className="text-xs font-medium text-[var(--color-muted-foreground)] !font-medium">
                    {title}
                </CardTitle>
                <span className="glass-chip text-[var(--color-primary)]">{icon}</span>
            </CardHeader>
            <CardContent>
                <div className="text-xl sm:text-2xl font-bold tabular-nums text-[var(--color-foreground)]">{value}</div>
                {subtitle && (
                    <p className="text-[11px] sm:text-xs text-[var(--color-muted-foreground)] mt-1">{subtitle}</p>
                )}
            </CardContent>
        </Card>
    );
}
