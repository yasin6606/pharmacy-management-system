// app/[locale]/(dashboard)/inventory/page.tsx
'use client';
import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {useRouter} from '@/navigation';
import {useRole} from '@/hooks/useRole';
import {Drug, PaginatedResponse, PaginationParams} from '@/types';
import {Button} from '@/components/ui/Button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/Card';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/Table';
import {Modal} from '@/components/ui/Modal';
import {Spinner} from '@/components/ui/Spinner';
import {Plus, Eye, Package, BarChart3} from 'lucide-react';
import {DrugForm} from '@/components/forms/DrugForm';
import {useApi} from '@/hooks/useAPI';
import {Pagination} from '@/components/ui/Pagination';

// Extend Drug type to include totalStock (added by backend)
export interface DrugWithStock extends Drug {
    totalStock?: number;
}

export default function InventoryPage() {
    const t = useTranslations('inventory');
    const commonT = useTranslations('common');
    const router = useRouter();
    const {canAdjustStock} = useRole();

    const [drugs, setDrugs] = useState<DrugWithStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const limit = 10;

    const {get} = useApi();

    const fetchDrugs = async (currentPage = 1) => {
        setLoading(true);
        const params: PaginationParams = {page: currentPage, limit};
        const data = await get<PaginatedResponse<DrugWithStock>>('/inventory/drugs', {params});

        if (data) {
            setDrugs(data.items);
            setPage(data.page);
            setTotalPages(data.totalPages);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchDrugs();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner size="lg"/>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('subtitle')}</p>
                </div>
                {canAdjustStock && (
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus className="h-4 w-4 mr-2"/>
                        {t('addDrug')}
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('allDrugs')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {drugs.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
                            <p className="text-muted-foreground">{t('noDrugs')}</p>
                            {canAdjustStock && (
                                <Button className="mt-4" onClick={() => setShowAddModal(true)}>
                                    <Plus className="h-4 w-4 mr-2"/>
                                    {t('addDrug')}
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('drugName')}</TableHead>
                                        <TableHead>{t('brand')}</TableHead>
                                        <TableHead>{t('company')}</TableHead>
                                        <TableHead className="text-center">{t('totalStock')}</TableHead>
                                        <TableHead>{t('enteringDate')}</TableHead>
                                        <TableHead className="w-[80px]">{commonT('actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {drugs.map((drug) => (
                                        <TableRow key={drug.id}>
                                            <TableCell className="font-medium">{drug.name}</TableCell>
                                            <TableCell>{drug.brand || '—'}</TableCell>
                                            <TableCell>{drug.company}</TableCell>
                                            <TableCell className="text-center">
                        <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                                (drug.totalStock ?? 0) < 10 ? 'text-red-600' : 'text-green-600'
                            }`}
                        >
                          <BarChart3 className="h-4 w-4"/>
                            {drug.totalStock ?? 0}
                        </span>
                                            </TableCell>
                                            <TableCell>{new Date(drug.enteringDate).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        router.push({
                                                            pathname: '/inventory/drugs/[id]',
                                                            params: {id: drug.id},
                                                        })
                                                    }
                                                    aria-label={t('viewDetails')}
                                                >
                                                    <Eye className="h-4 w-4"/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Pagination
                                page={page}
                                totalPages={totalPages}
                                onPageChange={(newPage) => fetchDrugs(newPage)}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title={t('addDrug')}>
                <DrugForm
                    onSuccess={() => {
                        setShowAddModal(false);
                        fetchDrugs();
                    }}
                    onCancel={() => setShowAddModal(false)}
                />
            </Modal>
        </div>
    );
}
