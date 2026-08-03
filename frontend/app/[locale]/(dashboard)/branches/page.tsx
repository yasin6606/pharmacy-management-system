'use client';
import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {useRole} from '@/hooks/useRole';
import {Branch, PaginatedResponse, PaginationParams} from '@/types';
import {Button} from '@/components/ui/Button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/Card';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/Table';
import {Modal} from '@/components/ui/Modal';
import {Input} from '@/components/ui/Input';
import {Badge} from '@/components/ui/Badge';
import {Spinner} from '@/components/ui/Spinner';
import {Plus, Pencil, Trash2, Building2, Warehouse} from 'lucide-react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useApi} from "@/hooks/useAPI";
import {Pagination} from "@/components/ui/Pagination";

export default function BranchesPage() {
    const t = useTranslations('branches');
    const commonT = useTranslations('common');
    const msgT = useTranslations('messages');
    const {canManageBranches} = useRole();

    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Branch | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const limit: number = 10;

    const {get, del} = useApi();

    const fetchBranches = async (currentPage: number = 1) => {
        setLoading(true);
        try {
            const params: PaginationParams = {page: currentPage, limit};
            const data = await get<PaginatedResponse<Branch>>('/branches', {params});

            if (data) {
                setBranches(data.items);
                setPage(data.page);
                setTotalPages(data.totalPages);
            }
        } catch (err) {
            setError(msgT('error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            await del(`/branches/${id}`);
            setBranches(branches.filter(b => b.id !== id));
            setDeleteConfirm(null);
        } catch (err) {
            setError(msgT('error'));
        }
    };

    const openEdit = (branch: Branch) => {
        if (!canManageBranches) return;
        setEditingBranch(branch);
        setModalOpen(true);
    };

    const openAdd = () => {
        if (!canManageBranches) return;
        setEditingBranch(null);
        setModalOpen(true);
    };

    if (!canManageBranches) {
        return (
            <div className="flex items-center justify-center h-64">
                <Card className="p-6 text-center">
                    <p className="text-muted-foreground">{commonT('unauthorized')}</p>
                </Card>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
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
                <Button onClick={openAdd} className="gap-2">
                    <Plus className="h-4 w-4"/>
                    {t('addBranch')}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('allBranches')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {branches.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">{t('noBranches')}</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('branchName')}</TableHead>
                                        <TableHead className="hidden md:table-cell">{t('address')}</TableHead>
                                        <TableHead>{t('type')}</TableHead>
                                        <TableHead className="w-[100px]">{commonT('actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {branches.map((branch) => (
                                        <TableRow key={branch.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {branch.isWarehouse ? (
                                                        <Warehouse
                                                            className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                                                    ) : (
                                                        <Building2
                                                            className="h-4 w-4 text-green-600 dark:text-green-400"/>
                                                    )}
                                                    {branch.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-muted-foreground">
                                                {branch.address || '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={branch.isWarehouse ? 'default' : 'success'}>
                                                    {branch.isWarehouse ? t('warehouse') : t('branch')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEdit(branch)}
                                                        aria-label={commonT('edit')}
                                                    >
                                                        <Pencil className="h-4 w-4"/>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteConfirm(branch)}
                                                        aria-label={commonT('delete')}
                                                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                                                    >
                                                        <Trash2 className="h-4 w-4"/>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Pagination
                                page={page}
                                totalPages={totalPages}
                                onPageChange={(newPage) => fetchBranches(newPage)}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            <BranchFormModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingBranch(null);
                }}
                branch={editingBranch}
                onSuccess={() => {
                    fetchBranches();
                    setModalOpen(false);
                    setEditingBranch(null);
                }}
            />

            <ConfirmDeleteModal
                open={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={() => deleteConfirm && handleDelete(deleteConfirm.id)}
                title={t('deleteTitle')}
                description={t('deleteConfirm', {name: deleteConfirm?.name})}
            />
        </div>
    );
}

// ====================== Branch Form Modal ======================

const branchSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    address: z.string().optional(),
    isWarehouse: z.boolean().optional()
});

type BranchFormData = z.infer<typeof branchSchema>;

function BranchFormModal({
                             open,
                             onClose,
                             branch,
                             onSuccess,
                         }: {
    open: boolean;
    onClose: () => void;
    branch: Branch | null;
    onSuccess: () => void;
}) {
    const t = useTranslations('branches');
    const commonT = useTranslations('common');
    const msgT = useTranslations('messages');

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {put, post} = useApi();

    const {
        register,
        handleSubmit,
        formState: {errors},
        reset,
    } = useForm<BranchFormData>({
        resolver: zodResolver(branchSchema),
        defaultValues: branch
            ? {
                name: branch.name,
                address: branch.address ?? '',   // convert null → ''
                isWarehouse: branch.isWarehouse,
            }
            : {name: '', address: '', isWarehouse: false}
    });

    useEffect(() => {
        if (branch) {
            reset({
                name: branch.name,
                address: branch.address ?? '',   // null → ''
                isWarehouse: branch.isWarehouse,
            });
        } else {
            reset({name: '', address: '', isWarehouse: false});
        }
    }, [branch, reset]);

    const onSubmit = async (data: BranchFormData) => {
        setSubmitting(true);
        setError(null);
        try {
            if (branch) {
                await put(`/branches/${branch.id}`, data);
            } else {
                await post('/branches', data);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || msgT('error'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title={branch ? t('editBranch') : t('addBranch')}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Input
                    label={t('branchName')}
                    {...register('name')}
                    error={errors.name?.message}
                />
                <Input
                    label={t('address')}
                    {...register('address')}
                    error={errors.address?.message}
                />
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="isWarehouse"
                        {...register('isWarehouse')}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="isWarehouse" className="text-sm font-medium">
                        {t('isWarehouse')}
                    </label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                        {commonT('cancel')}
                    </Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? commonT('saving') : commonT('save')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

// ====================== Confirm Delete Modal ======================

function ConfirmDeleteModal({
                                open,
                                onClose,
                                onConfirm,
                                title,
                                description,
                            }: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
}) {
    const commonT = useTranslations('common');

    return (
        <Modal open={open} onClose={onClose} title={title}>
            <p className="text-muted-foreground mb-6">{description}</p>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                    {commonT('cancel')}
                </Button>
                <Button variant="danger" onClick={onConfirm}>
                    {commonT('delete')}
                </Button>
            </div>
        </Modal>
    );
}
