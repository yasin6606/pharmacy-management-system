'use client';
import {useEffect, useState} from 'react';
import {useTranslations, useLocale} from 'next-intl';
import {useAuth} from '@/context/AuthContext';
import {useApi} from '@/hooks/useAPI';
import {SalesReportItem, Branch, PaginationParams, PaginatedResponse} from '@/types';
import {Button} from '@/components/ui/Button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/Card';
import {Input} from '@/components/ui/Input';
import {Select} from '@/components/ui/Select';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/Table';
import {Spinner} from '@/components/ui/Spinner';
import {FileText, FileSpreadsheet} from 'lucide-react';
import {Pagination} from '@/components/ui/Pagination';
import {formatIRR} from '@/lib/currency';

export default function ReportsPage() {
    const reportT = useTranslations('reports');
    const branchT = useTranslations('branches');
    const locale = useLocale() as 'fa' | 'en';

    const {get} = useApi();
    const {user} = useAuth();

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [branchId, setBranchId] = useState(user?.currentBranchId || '');
    const [reportData, setReportData] = useState<SalesReportItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loadingBranches, setLoadingBranches] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    const fetchBranches = async () => {
        const data = await get<PaginatedResponse<Branch>>('/branches');
        if (data) setBranches(data.items);
        setLoadingBranches(false);
    };

    useEffect(() => {
        fetchBranches();
    }, [get]);

    const branchOptions = [
        {value: '', label: reportT('allBranches')},
        ...branches.map((b) => ({value: b.id, label: b.name})),
    ];

    const fetchReport = async (currentPage: number = 1) => {
        setLoading(true);
        const params: PaginationParams = {page: currentPage, limit};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (branchId) params.branchId = branchId;

        const data = await get<PaginatedResponse<SalesReportItem>>('/reporting/sales', {params});
        if (data) {
            setReportData(data.items);
            setPage(data.page);
            setTotalPages(data.totalPages);
        }
        setLoading(false);
    };

    const exportReport = async (format: 'csv' | 'pdf') => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (branchId) params.append('branchId', branchId);
        params.append('format', format);

        const {api} = await import('@/lib/api');
        const response = await api.get<Blob>(`/reporting/sales/export?${params.toString()}`, {
            responseType: 'blob',
        });

        const blob = new Blob([response.data], {
            type: format === 'csv' ? 'text/csv' : 'application/pdf',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `sales_report.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{reportT('title')}</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">{reportT('salesReport')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            type="date"
                            label={reportT('startDate')}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-xs sm:text-sm"
                        />
                        <Input
                            type="date"
                            label={reportT('endDate')}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-xs sm:text-sm"
                        />
                        <Select
                            label={branchT('branch')}
                            options={branchOptions}
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                            disabled={loadingBranches}
                            className="text-xs sm:text-sm"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button onClick={() => fetchReport(1)} className="text-xs sm:text-sm">
                            {reportT('generate')}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => exportReport('csv')}
                            disabled={reportData.length === 0}
                            className="text-xs sm:text-sm"
                        >
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            CSV
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => exportReport('pdf')}
                            disabled={reportData.length === 0}
                            className="text-xs sm:text-sm"
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            PDF
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex justify-center py-8">
                    <Spinner size="lg" />
                </div>
            ) : reportData.length > 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs sm:text-sm">{reportT('date')}</TableHead>
                                        <TableHead className="text-xs sm:text-sm">{reportT('branch')}</TableHead>
                                        <TableHead className="text-xs sm:text-sm">{reportT('employee')}</TableHead>
                                        <TableHead className="text-xs sm:text-sm">{reportT('drug')}</TableHead>
                                        <TableHead className="text-right text-xs sm:text-sm">
                                            {reportT('quantity')}
                                        </TableHead>
                                        <TableHead className="text-right text-xs sm:text-sm">
                                            {reportT('revenue')} (IRR)
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reportData.map((row, i) => (
                                        <TableRow key={`${row.date}-${row.branch}-${i}`}>
                                            <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                                                {row.date}
                                            </TableCell>
                                            <TableCell className="text-xs sm:text-sm">{row.branch}</TableCell>
                                            <TableCell className="text-xs sm:text-sm">{row.employee}</TableCell>
                                            <TableCell className="text-xs sm:text-sm">{row.drug}</TableCell>
                                            <TableCell className="text-right text-xs sm:text-sm">
                                                {row.totalQuantity}
                                            </TableCell>
                                            <TableCell className="text-right text-xs sm:text-sm tabular-nums">
                                                {formatIRR(row.totalRevenue, locale)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Pagination
                                page={page}
                                totalPages={totalPages}
                                onPageChange={(newPage) => fetchReport(newPage)}
                            />
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <p className="text-center text-muted-foreground py-8 text-sm">{reportT('noData')}</p>
            )}
        </div>
    );
}
