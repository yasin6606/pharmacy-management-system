'use client';
import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {useAuth} from '@/context/AuthContext';
import {useRole} from '@/hooks/useRole';
import {DrugBatch, Drug, Branch} from '@/types';
import {Button} from '@/components/ui/Button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/Card';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/Table';
import {Modal} from '@/components/ui/Modal';
import {Input} from '@/components/ui/Input';
import {Select} from '@/components/ui/Select';
import {Badge} from '@/components/ui/Badge';
import {Spinner} from '@/components/ui/Spinner';
import {Plus, ArrowRightLeft, RefreshCw, AlertTriangle} from 'lucide-react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useApi} from "@/hooks/useAPI";

export default function BatchesPage() {
    const t = useTranslations('inventory');
    const commonT = useTranslations('common');
    const {user} = useAuth();
    const {canAdjustStock} = useRole();

    const [batches, setBatches] = useState<DrugBatch[]>([]);
    const [drugs, setDrugs] = useState<Drug[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddBatch, setShowAddBatch] = useState(false);
    const [showTransfer, setShowTransfer] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState<DrugBatch | null>(null);

    const {get, post} = useApi();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [batchesRes, drugsRes, branchesRes] = await Promise.all([
                get<DrugBatch[]>(`/inventory/branches/${user?.currentBranchId}/inventory`),
                get<Drug[]>('/inventory/drugs'),
                get<Branch[]>('/branches'),
            ]);
            batchesRes && setBatches(batchesRes);
            drugsRes && setDrugs(drugsRes);
            branchesRes && setBranches(branchesRes);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.currentBranchId) fetchData();
    }, [user]);

    const handleUpdatePrice = async (drugId: string) => {
        try {
            await post(`/integrations/titak/update-price/${drugId}`, {});
            fetchData();
        } catch (error) {
            alert(commonT('error'));
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Spinner size="lg"/>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('batches')}</h1>
                {canAdjustStock && (
                    <div className="flex gap-2">
                        <Button onClick={() => setShowAddBatch(true)} className="gap-2">
                            <Plus className="h-4 w-4"/>
                            {t('addBatch')}
                        </Button>
                    </div>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('currentStock')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('drugName')}</TableHead>
                                    <TableHead>{t('batch')}</TableHead>
                                    <TableHead>{t('expirationDate')}</TableHead>
                                    <TableHead>{t('stock')}</TableHead>
                                    <TableHead>{t('price')}</TableHead>
                                    <TableHead>{t('offer')}</TableHead>
                                    <TableHead className="w-[120px]">{commonT('actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {batches.map((batch) => {
                                    const isExpiring = new Date(batch.expirationDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
                                    return (
                                        <TableRow key={batch.id}>
                                            <TableCell className="font-medium">{batch.drug?.name}</TableCell>
                                            <TableCell className="font-mono text-xs">{batch.id.slice(0, 8)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {new Date(batch.expirationDate).toLocaleDateString()}
                                                    {isExpiring && <AlertTriangle className="h-4 w-4 text-amber-500"/>}
                                                </div>
                                            </TableCell>
                                            <TableCell className={batch.count < 10 ? 'text-red-600 font-medium' : ''}>
                                                {batch.count}
                                            </TableCell>
                                            <TableCell>${batch.sellingPrice}</TableCell>
                                            <TableCell>
                                                <Badge variant={batch.isOffer ? 'success' : 'default'}>
                                                    {batch.isOffer ? t('yes') : t('no')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleUpdatePrice(batch.drugId)}
                                                        title={t('updatePrice')}
                                                    >
                                                        <RefreshCw className="h-4 w-4"/>
                                                    </Button>
                                                    {canAdjustStock && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setSelectedBatch(batch);
                                                                setShowTransfer(true);
                                                            }}
                                                            title={t('transfer')}
                                                        >
                                                            <ArrowRightLeft className="h-4 w-4"/>
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {showAddBatch && (
                <AddBatchModal
                    open={showAddBatch}
                    onClose={() => setShowAddBatch(false)}
                    drugs={drugs}
                    branches={branches}
                    currentBranchId={user?.currentBranchId || ''}
                    onSuccess={() => {
                        setShowAddBatch(false);
                        fetchData();
                    }}
                />
            )}

            {showTransfer && selectedBatch && (
                <TransferModal
                    open={showTransfer}
                    onClose={() => {
                        setShowTransfer(false);
                        setSelectedBatch(null);
                    }}
                    batch={selectedBatch}
                    branches={branches.filter(b => b.id !== selectedBatch.branchId)}
                    onSuccess={() => {
                        setShowTransfer(false);
                        setSelectedBatch(null);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
}

// ------------------- Add Batch Modal -------------------
const addBatchSchema = z.object({
    drugId: z.string().uuid(),
    branchId: z.string().uuid(),
    expirationDate: z.string().min(1),
    count: z.coerce.number().int().min(0),
    isOffer: z.boolean().default(false),
    exchangedQuantity: z.coerce.number().int().default(0),
    purchasePrice: z.coerce.number().positive().optional(),
    sellingPrice: z.coerce.number().positive().optional(),
});

function AddBatchModal({open, onClose, drugs, branches, currentBranchId, onSuccess}: any) {
    const t = useTranslations('inventory');
    const commonT = useTranslations('common');
    const [submitting, setSubmitting] = useState(false);
    const {register, handleSubmit, formState: {errors}} = useForm({
        resolver: zodResolver(addBatchSchema),
        defaultValues: {branchId: currentBranchId, count: 0, isOffer: false, exchangedQuantity: 0},
    });

    const {post} = useApi();

    const onSubmit = async (data: any) => {
        setSubmitting(true);
        try {
            await post('/inventory/batches', data);
            onSuccess();
        } catch (error) {
            alert(commonT('error'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title={t('addBatch')}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Select label={t('drug')}
                        options={drugs.map((d: Drug) => ({value: d.id, label: d.name}))} {...register('drugId')}
                        error={errors.drugId?.message}/>
                <Select label={t('branch')}
                        options={branches.map((b: Branch) => ({value: b.id, label: b.name}))} {...register('branchId')}
                        error={errors.branchId?.message}/>
                <Input type="date" label={t('expirationDate')} {...register('expirationDate')}
                       error={errors.expirationDate?.message}/>
                <Input type="number" label={t('stock')} {...register('count')} error={errors.count?.message}/>
                <Input type="number" step="0.01" label={t('purchasePrice')} {...register('purchasePrice')}
                       error={errors.purchasePrice?.message}/>
                <Input type="number" step="0.01" label={t('sellingPrice')} {...register('sellingPrice')}
                       error={errors.sellingPrice?.message}/>
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="isOffer" {...register('isOffer')} className="h-4 w-4"/>
                    <label htmlFor="isOffer">{t('offer')}</label>
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>{commonT('cancel')}</Button>
                    <Button type="submit"
                            disabled={submitting}>{submitting ? commonT('saving') : commonT('save')}</Button>
                </div>
            </form>
        </Modal>
    );
}

// ------------------- Transfer Modal -------------------
const transferSchema = z.object({
    toBranchId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
});

function TransferModal({open, onClose, batch, branches, onSuccess}: any) {
    const t = useTranslations('inventory');
    const commonT = useTranslations('common');
    const [submitting, setSubmitting] = useState(false);
    const {register, handleSubmit, formState: {errors}} = useForm({
        resolver: zodResolver(transferSchema),
    });

    const {post} = useApi();

    const onSubmit = async (data: any) => {
        setSubmitting(true);
        try {
            await post('/inventory/transfer', {batchId: batch.id, ...data});
            onSuccess();
        } catch (error) {
            alert(commonT('error'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title={t('transferStock')}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <p>{t('transferFrom')}: {batch.drug?.name} ({batch.count} {t('available')})</p>
                <Select label={t('toBranch')} options={branches.map((b: Branch) => ({
                    value: b.id,
                    label: b.name
                }))} {...register('toBranchId')} error={errors.toBranchId?.message}/>
                <Input type="number" label={t('quantity')} {...register('quantity')} error={errors.quantity?.message}
                       max={batch.count}/>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>{commonT('cancel')}</Button>
                    <Button type="submit"
                            disabled={submitting}>{submitting ? commonT('processing') : t('transfer')}</Button>
                </div>
            </form>
        </Modal>
    );
}
