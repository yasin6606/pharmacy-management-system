// app/[locale]/(dashboard)/dashboard/page.tsx
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
    Package, ShoppingCart, AlertTriangle, FileText, ArrowRightLeft, DollarSign, Users
} from 'lucide-react';
import {Drug, DrugBatch, LossReport, PaginatedResponse, Sale} from '@/types';

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

            // ----- Total Drugs (paginated, we only need total count) -----
            const drugsRes = await get<PaginatedResponse<Drug>>('/inventory/drugs', {params: {limit: 1}});
            const totalDrugs = drugsRes?.total || 0;

            // ----- Branch Batches (non‑paginated array) -----
            let batches: DrugBatch[] = [];
            if (branchId) batches = await get<DrugBatch[]>(`/inventory/branches/${branchId}/inventory`) || [];

            // ----- Today's Sales (paginated, use total) -----
            const salesTodayRes = await get<PaginatedResponse<Sale>>('/sales', {
                params: {startDate: today, endDate: today, limit: 1},
            });
            const todayTransactions = salesTodayRes?.total || 0;
            const todaySales = Array.isArray(salesTodayRes?.items)
                ? salesTodayRes.items.reduce((sum: number, s: Sale) => sum + Number(s.totalPrice), 0)
                : 0;

            // ----- Pending Loss Reports (paginated, use total) -----
            const lossRes = await get<PaginatedResponse<LossReport>>('/loss-reports', {
                params: {status: 'pending', limit: 1},
            });
            const pendingLoss = lossRes?.total || 0;

            // ----- Expiring Soon & Low Stock (from local batches array) -----
            const now = Date.now();
            const thirtyDays = 30 * 24 * 60 * 60 * 1000;
            const expiringSoon = batches.filter((b: { expirationDate: string }) => {
                const exp = new Date(b.expirationDate).getTime();
                return exp - now <= thirtyDays && exp > now;
            }).length;
            const lowStock = batches.filter((b: { count: number }) => b.count < 10).length;

            // ----- Recent Sales (paginated, limit 5) -----
            const recentRes = await get<PaginatedResponse<Sale>>('/sales', {params: {limit: 5}});
            const recentSales = recentRes?.items || [];

            // Update state
            setStats({
                totalDrugs,
                todaySales,
                todayTransactions,
                expiringSoon,
                lowStock,
                pendingLoss,
            });
            setRecentSales(recentSales);
        } catch (err) {
            // global error toast handles it
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
                <Spinner size="lg"/>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                        {t('welcome')}, {user?.fullName}
                    </h1>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                        {new Date().toLocaleDateString(undefined, {weekday: 'long', month: 'long', day: 'numeric'})}
                    </p>
                </div>
                <div className="flex gap-2 mt-2 sm:mt-0">
                    {canAdjustStock && (
                        <Button size="sm" onClick={() => router.push('/inventory')}>
                            <Package className="h-4 w-4 mr-1"/>
                            {t('manageInventory')}
                        </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => router.push('/sales')}>
                        <ShoppingCart className="h-4 w-4 mr-1"/>
                        {t('newSale')}
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <StatsCard title={t('totalDrugs')} value={stats.totalDrugs}
                           icon={<Package className="h-5 w-5 text-primary"/>}/>
                <StatsCard title={t('todaySales')} value={`$${stats.todaySales.toFixed(2)}`}
                           subtitle={`${stats.todayTransactions} ${t('transactions')}`}
                           icon={<DollarSign className="h-5 w-5 text-emerald-500"/>}/>
                <StatsCard title={t('expiringSoon')} value={stats.expiringSoon}
                           icon={<AlertTriangle className="h-5 w-5 text-amber-500"/>}
                           className={stats.expiringSoon > 0 ? 'border-amber-500/30' : ''}/>
                <StatsCard title={t('lowStock')} value={stats.lowStock}
                           icon={<ArrowRightLeft className="h-5 w-5 text-red-500"/>}
                           className={stats.lowStock > 0 ? 'border-red-500/30' : ''}/>
                <StatsCard title={t('pendingLoss')} value={stats.pendingLoss}
                           icon={<FileText className="h-5 w-5 text-blue-500"/>}
                           className={stats.pendingLoss > 0 ? 'border-blue-500/30' : ''}/>
            </div>

            {/* Recent Sales & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base sm:text-lg">{t('recentSales')}</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => router.push('/sales')}>
                            {t('viewAll')}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {recentSales.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8 text-sm">{t('noSales')}</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-xs sm:text-sm">{commonT('date')}</TableHead>
                                            <TableHead className="text-xs sm:text-sm">{t('drug')}</TableHead>
                                            <TableHead className="text-xs sm:text-sm">{t('quantity')}</TableHead>
                                            <TableHead
                                                className="text-right text-xs sm:text-sm">{t('total')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentSales.map(sale => (
                                            <TableRow key={sale.id}>
                                                <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                                                    {new Date(sale.soldDate).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm font-medium">
                                                    {sale.drugBatch?.drug?.name || '—'}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">{sale.quantity}</TableCell>
                                                <TableCell className="text-right text-xs sm:text-sm font-semibold">
                                                    ${Number(sale.totalPrice).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base sm:text-lg">{t('quickActions')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full justify-start"
                                onClick={() => router.push('/loss-reports')}>
                            <AlertTriangle className="h-4 w-4 mr-2"/>
                            {t('reportLoss')}
                        </Button>
                        {canAdjustStock && (
                            <>
                                <Button variant="outline" className="w-full justify-start"
                                        onClick={() => router.push('/inventory')}>
                                    <Package className="h-4 w-4 mr-2"/>
                                    {t('manageInventory')}
                                </Button>
                                <Button variant="outline" className="w-full justify-start"
                                        onClick={() => router.push('/employees')}>
                                    <Users className="h-4 w-4 mr-2"/>
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

// StatsCard component remains unchanged
interface StatsCardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: React.ReactNode;
    className?: string;
}

function StatsCard({title, value, subtitle, icon, className}: StatsCardProps) {
    return (
        <Card className={`transition-colors ${className || ''}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-foreground">{value}</div>
                {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            </CardContent>
        </Card>
    );
}
