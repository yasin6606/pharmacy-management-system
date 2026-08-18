'use client';
import {useCallback, useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {useRouter} from '@/navigation';
import {useRole} from '@/hooks/useRole';
import {Drug, PaginatedResponse} from '@/types';
import {Button} from '@/components/ui/Button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/Card';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/Table';
import {Modal} from '@/components/ui/Modal';
import {Input} from '@/components/ui/Input';
import {Spinner} from '@/components/ui/Spinner';
import {Plus, Eye, Package, BarChart3, Search, Trash2, Pencil} from 'lucide-react';
import {DrugForm} from '@/components/forms/DrugForm';
import {useApi} from '@/hooks/useAPI';
import {Pagination} from '@/components/ui/Pagination';

export interface DrugWithStock extends Drug {
    totalStock?: number;
}

export default function InventoryPage() {
    const t = useTranslations('inventory');
    const commonT = useTranslations('common');
    const router = useRouter();
    const {canAdjustStock, isManager} = useRole();

    const [drugs, setDrugs] = useState<DrugWithStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editDrug, setEditDrug] = useState<DrugWithStock | null>(null);
    const [deleteDrug, setDeleteDrug] = useState<DrugWithStock | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const limit = 10;

    const {get, del} = useApi();

    const fetchDrugs = useCallback(
        async (currentPage = 1, q = search) => {
            setLoading(true);
            const data = await get<PaginatedResponse<DrugWithStock>>('/inventory/drugs', {
                params: {page: currentPage, limit, search: q || undefined},
            });

            if (data) {
                setDrugs(data.items || []);
                setPage(data.page);
                setTotalPages(data.totalPages || 1);
                setTotal(data.total || 0);
            }
            setLoading(false);
        },
        [get, search]
    );

    useEffect(() => {
        fetchDrugs(1, search);
    }, [search]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput.trim());
        setPage(1);
    };

    const confirmDelete = async () => {
        if (!deleteDrug) return;
        const ok = await del(`/inventory/drugs/${deleteDrug.id}`);
        if (ok !== undefined) {
            setDeleteDrug(null);
            fetchDrugs(page, search);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="page-title text-2xl md:text-3xl text-[var(--color-foreground)]">{t('title')}</h1>
                    <p className="text-[var(--color-muted-foreground)] text-sm">
                        {t('subtitle')} · {total} {t('allDrugs').toLowerCase()}
                    </p>
                </div>
                {canAdjustStock && (
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus className="h-4 w-4" />
                        {t('addDrug')}
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle>{t('allDrugs')}</CardTitle>
                    <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto sm:min-w-[280px]">
                        <div className="relative flex-1">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-foreground)]" />
                            <input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder={`${t('drugName')}…`}
                                className="h-10 w-full rounded-xl border border-[var(--color-input)] bg-[color-mix(in_oklab,var(--color-card)_80%,transparent)] ps-9 pe-3 text-sm"
                            />
                        </div>
                        <Button type="submit" variant="outline" size="default">
                            {commonT('search') || 'Search'}
                        </Button>
                    </form>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Spinner size="lg" />
                        </div>
                    ) : drugs.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="mx-auto h-12 w-12 text-[var(--color-muted-foreground)] mb-4" />
                            <p className="text-[var(--color-muted-foreground)]">{t('noDrugs')}</p>
                            {canAdjustStock && (
                                <Button className="mt-4" onClick={() => setShowAddModal(true)}>
                                    <Plus className="h-4 w-4" />
                                    {t('addDrug')}
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('drugName')}</TableHead>
                                            <TableHead>{t('brand')}</TableHead>
                                            <TableHead>{t('company')}</TableHead>
                                            <TableHead className="text-center">{t('totalStock')}</TableHead>
                                            <TableHead>{t('enteringDate')}</TableHead>
                                            <TableHead className="w-[120px]">{commonT('actions')}</TableHead>
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
                                                        className={`inline-flex items-center gap-1 font-semibold tabular-nums ${
                                                            (drug.totalStock ?? 0) < 10
                                                                ? 'text-red-600 dark:text-red-400'
                                                                : 'text-emerald-600 dark:text-emerald-400'
                                                        }`}
                                                    >
                                                        <BarChart3 className="h-4 w-4" />
                                                        {drug.totalStock ?? 0}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(drug.enteringDate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
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
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {canAdjustStock && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setEditDrug(drug)}
                                                                aria-label={commonT('edit')}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {isManager && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-[var(--color-destructive)]"
                                                                onClick={() => setDeleteDrug(drug)}
                                                                aria-label={commonT('delete')}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <Pagination
                                page={page}
                                totalPages={totalPages}
                                onPageChange={(newPage) => fetchDrugs(newPage, search)}
                            />
                        </>
                    )}
                </CardContent>
            </Card>

            <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title={t('addDrug')}>
                <DrugForm
                    onSuccess={() => {
                        setShowAddModal(false);
                        fetchDrugs(1, search);
                    }}
                    onCancel={() => setShowAddModal(false)}
                />
            </Modal>

            <Modal open={!!editDrug} onClose={() => setEditDrug(null)} title={t('editDrug') || commonT('edit')}>
                {editDrug && (
                    <DrugForm
                        drug={editDrug}
                        onSuccess={() => {
                            setEditDrug(null);
                            fetchDrugs(page, search);
                        }}
                        onCancel={() => setEditDrug(null)}
                    />
                )}
            </Modal>

            <Modal open={!!deleteDrug} onClose={() => setDeleteDrug(null)} title={commonT('delete')}>
                <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
                    Delete <strong>{deleteDrug?.name}</strong>? Only allowed when stock is zero.
                </p>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDeleteDrug(null)}>
                        {commonT('cancel')}
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        {commonT('delete')}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
