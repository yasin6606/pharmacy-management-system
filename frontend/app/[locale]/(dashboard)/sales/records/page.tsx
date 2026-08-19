'use client';
import {useState, useEffect} from 'react';
import {useTranslations, useLocale} from 'next-intl';
import {useApi} from '@/hooks/useAPI';
import {useRole} from '@/hooks/useRole';
import {Sale, Branch, PaginatedResponse} from '@/types';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/Card';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/Table';
import {Select} from '@/components/ui/Select';
import {Pagination} from '@/components/ui/Pagination';
import {Filter, ShoppingCart} from 'lucide-react';
import {formatIRR} from '@/lib/currency';

export default function SalesRecordsPage() {
    const t = useTranslations('sales');
    const c = useTranslations('common');
    const b = useTranslations('branches');
    const locale = useLocale() as 'fa' | 'en';
    const {isManager, isAccountant} = useRole();
    const {get} = useApi();

    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [branchId, setBranchId] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    useEffect(() => {
        if (isManager || isAccountant) {
            get<PaginatedResponse<Branch>>('/branches', {params: {limit: 100}}).then(
                (d) => d && setBranches(d.items)
            );
        }
    }, [get, isManager, isAccountant]);

    const fetchSales = async (currentPage = 1) => {
        setLoading(true);
        const params: Record<string, string | number> = {page: currentPage, limit};
        if (branchId) params.branchId = branchId;
        const data = await get<PaginatedResponse<Sale>>('/sales', {params});
        if (data) {
            setSales(data.items);
            setTotalPages(data.totalPages);
            setPage(data.page);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSales();
    }, [branchId]);

    const branchOptions = [
        {value: '', label: b('allBranches') || 'All Branches'},
        ...branches.map((br) => ({value: br.id, label: br.name})),
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('salesRecords')}</h1>

            {(isManager || isAccountant) && (
                <div className="flex items-center gap-4">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select
                        label=""
                        options={branchOptions}
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        className="w-48 text-sm"
                    />
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>{t('allSales')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12">{c('loading')}</div>
                    ) : sales.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <ShoppingCart className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p>{t('noSales')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('date')}</TableHead>
                                        <TableHead>{t('drug')}</TableHead>
                                        <TableHead>{t('quantity')}</TableHead>
                                        <TableHead>{t('unitPrice')}</TableHead>
                                        <TableHead>{t('total')}</TableHead>
                                        <TableHead>{t('employee')}</TableHead>
                                        <TableHead>{t('branch')}</TableHead>
                                        <TableHead>{t('paymentMethod')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sales.map((s) => (
                                        <TableRow key={s.id}>
                                            <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                                                {new Date(s.soldDate).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="font-medium text-xs sm:text-sm">
                                                {s.drugBatch?.drug?.name || '—'}
                                            </TableCell>
                                            <TableCell className="text-xs sm:text-sm">{s.quantity}</TableCell>
                                            <TableCell className="text-xs sm:text-sm tabular-nums">
                                                {formatIRR(s.unitPrice, locale)}
                                            </TableCell>
                                            <TableCell className="font-semibold text-xs sm:text-sm tabular-nums">
                                                {formatIRR(s.totalPrice, locale)}
                                            </TableCell>
                                            <TableCell className="text-xs sm:text-sm">
                                                {s.employee?.fullName || '—'}
                                            </TableCell>
                                            <TableCell className="text-xs sm:text-sm">
                                                {s.branch?.name || '—'}
                                            </TableCell>
                                            <TableCell className="text-xs sm:text-sm">
                                                {t(`payment.${s.paymentMethod || 'cash'}`)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Pagination page={page} totalPages={totalPages} onPageChange={(p) => fetchSales(p)} />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
