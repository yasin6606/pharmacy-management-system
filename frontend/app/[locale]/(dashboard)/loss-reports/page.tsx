// app/[locale]/(dashboard)/loss-reports/page.tsx
'use client';
import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {useApi} from '@/hooks/useAPI';
import {useRole} from '@/hooks/useRole';
import {LossReport, PaginatedResponse} from '@/types';
import {Button} from '@/components/ui/Button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/Card';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/Table';
import {Modal} from '@/components/ui/Modal';
import {Badge} from '@/components/ui/Badge';
import {LossReportForm} from '@/components/forms/LossReportForm';
import {Pagination} from '@/components/ui/Pagination';
import {AlertTriangle} from 'lucide-react';

export default function LossReportsPage() {
    const t = useTranslations('lossReports');
    const commonT = useTranslations('common');

    const {canApproveLoss} = useRole();
    const {get, patch} = useApi();

    const [reports, setReports] = useState<LossReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    const fetchReports = async (currentPage = 1) => {
        setLoading(true);
        const data = await get<PaginatedResponse<LossReport>>('/loss-reports', {
            params: {page: currentPage, limit},
        });
        if (data) {
            setReports(data.items);
            setTotalPages(data.totalPages);
            setPage(data.page);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleReview = async (id: string, status: 'approved' | 'rejected') => {
        await patch(`/loss-reports/${id}/review`, {status});
        // Refresh the current page after action
        fetchReports(page);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                    {t('title')}
                </h1>
                <Button onClick={() => setShowForm(true)}>
                    <AlertTriangle className="h-4 w-4 mr-2"/>
                    {t('reportLoss')}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('allReports')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12">{commonT('loading')}</div>
                    ) : reports.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <AlertTriangle className="mx-auto h-12 w-12 mb-4 opacity-50"/>
                            <p>{t('noReports')}</p>
                            <Button className="mt-4" onClick={() => setShowForm(true)}>
                                {t('reportLoss')}
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{commonT('date')}</TableHead>
                                            <TableHead>{t('drug')}</TableHead>
                                            <TableHead>{t('quantity')}</TableHead>
                                            <TableHead>{t('availableStock')}</TableHead>
                                            <TableHead>{t('reportedBy')}</TableHead>
                                            <TableHead>{t('reason')}</TableHead>
                                            <TableHead>{t('status')}</TableHead>
                                            <TableHead>{commonT('actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reports.map((report) => (
                                            <TableRow key={report.id}>
                                                <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                                                    {new Date(report.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                    {report.drug?.name || '—'}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">{report.quantity}</TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                    {report.availableStock !== undefined ? report.availableStock : '—'}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                    {report.reportedBy?.fullName || '—'}
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate text-xs sm:text-sm">
                                                    {report.reason}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            report.status === 'pending'
                                                                ? 'warning'
                                                                : report.status === 'approved'
                                                                    ? 'success'
                                                                    : 'danger'
                                                        }
                                                    >
                                                        {t(`statusList.${report.status}`)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {canApproveLoss && report.status === 'pending' && (
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleReview(report.id, 'approved')}
                                                            >
                                                                {t('approve')}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleReview(report.id, 'rejected')}
                                                            >
                                                                {t('reject')}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <Pagination
                                page={page}
                                totalPages={totalPages}
                                onPageChange={(newPage) => fetchReports(newPage)}
                            />
                        </>
                    )}
                </CardContent>
            </Card>

            <Modal open={showForm} onClose={() => setShowForm(false)} title={t('reportLoss')}>
                <LossReportForm
                    onSuccess={() => {
                        setShowForm(false);
                        fetchReports(page);
                    }}
                    onCancel={() => setShowForm(false)}
                />
            </Modal>
        </div>
    );
}
