'use client';
import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {useParams} from 'next/navigation';
import {useRouter} from '@/navigation';
import {useRole} from '@/hooks/useRole';
import {Drug, DrugBatch} from '@/types';
import {Button} from '@/components/ui/Button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/Card';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/Table';
import {Modal} from '@/components/ui/Modal';
import {Badge} from '@/components/ui/Badge';
import {Spinner} from '@/components/ui/Spinner';
import {ArrowLeft, Pencil, Plus, RefreshCw, AlertTriangle, Package} from 'lucide-react';
import {DrugForm} from '@/components/forms/DrugForm';
import {AddBatchForm} from '@/components/forms/AddBatchForm';
import {useApi} from "@/hooks/useAPI"; // You'll need to create this or use inline modal

export default function DrugDetailPage() {
    const inventoryT = useTranslations('inventory');
    const commonT = useTranslations('common');
    const msgT = useTranslations('messages');

    const router = useRouter();
    const params = useParams();
    const {canAdjustStock} = useRole();

    const drugId = params.id as string;

    const [drug, setDrug] = useState<Drug | null>(null);
    const [batches, setBatches] = useState<DrugBatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [addBatchModalOpen, setAddBatchModalOpen] = useState(false);
    const [updatePriceLoading, setUpdatePriceLoading] = useState(false);

    const {get, post} = useApi();

    const fetchDrugData = async () => {
        setLoading(true);
        try {
            const drugData = await get<Drug>(`/inventory/drugs/${drugId}`);

            if (drugData) {
                setDrug(drugData);
                setBatches(drugData.batches || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (drugId) fetchDrugData();
    }, [drugId]);

    const handleUpdatePrice = async () => {
        if (!drug) return;
        setUpdatePriceLoading(true);
        try {
            await post(`/integrations/titak/update-price/${drug.id}`, {});
            await fetchDrugData();
        } catch (error) {
            alert(msgT('error'));
        } finally {
            setUpdatePriceLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner size="lg"/>
            </div>
        );
    }

    if (!drug) {
        return (
            <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
                <h2 className="text-xl font-semibold">{inventoryT('drugNotFound')}</h2>
                <Button className="mt-4" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2"/>
                    {commonT('back')}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5"/>
                    </Button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{drug.name}</h1>
                        <p className="text-muted-foreground">{drug.company}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {canAdjustStock && (
                        <>
                            <Button variant="outline" onClick={() => setEditModalOpen(true)}>
                                <Pencil className="h-4 w-4 mr-2"/>
                                {commonT('edit')}
                            </Button>
                            <Button onClick={handleUpdatePrice} disabled={updatePriceLoading}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${updatePriceLoading ? 'animate-spin' : ''}`}/>
                                {inventoryT('updatePrice')}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Drug Details Card */}
            <Card>
                <CardHeader>
                    <CardTitle>{inventoryT('drugDetails')}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{inventoryT('brand')}</p>
                        <p className="text-foreground">{drug.brand || '—'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{inventoryT('company')}</p>
                        <p className="text-foreground">{drug.company}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{inventoryT('enteringDate')}</p>
                        <p className="text-foreground">{new Date(drug.enteringDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{inventoryT('lastPriceUpdate')}</p>
                        <p className="text-foreground">
                            {drug.lastPriceUpdateDate ? new Date(drug.lastPriceUpdateDate).toLocaleString() : '—'}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Batches Section */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-foreground">{inventoryT('batches')}</h2>
                {canAdjustStock && (
                    <Button onClick={() => setAddBatchModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2"/>
                        {inventoryT('addBatch')}
                    </Button>
                )}
            </div>

            <Card>
                <CardContent className="pt-6">
                    {batches.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">{inventoryT('noBatches')}</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{inventoryT('batchId')}</TableHead>
                                        <TableHead>{inventoryT('branch')}</TableHead>
                                        <TableHead>{inventoryT('expirationDate')}</TableHead>
                                        <TableHead>{inventoryT('stock')}</TableHead>
                                        <TableHead>{inventoryT('sellingPrice')}</TableHead>
                                        <TableHead>{inventoryT('offer')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {batches.map((batch) => {
                                        const isExpiringSoon =
                                            new Date(batch.expirationDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
                                        return (
                                            <TableRow key={batch.id}>
                                                <TableCell
                                                    className="font-mono text-xs">{batch.id.slice(0, 8)}</TableCell>
                                                <TableCell>{batch.branch?.name || '—'}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        {new Date(batch.expirationDate).toLocaleDateString()}
                                                        {isExpiringSoon && (
                                                            <span title={inventoryT('expiringSoon')}> <AlertTriangle
                                                                className="h-4 w-4 text-amber-500"/> </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell
                                                    className={batch.count < 10 ? 'text-red-600 font-medium' : ''}>
                                                    {batch.count}
                                                </TableCell>
                                                <TableCell>${batch.sellingPrice}</TableCell>
                                                <TableCell>
                                                    <Badge variant={batch.isOffer ? 'success' : 'default'}>
                                                        {batch.isOffer ? inventoryT('yes') : inventoryT('no')}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Drug Modal */}
            <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title={inventoryT('editDrug')}>
                <DrugForm
                    drug={drug}
                    onSuccess={() => {
                        setEditModalOpen(false);
                        fetchDrugData();
                    }}
                    onCancel={() => setEditModalOpen(false)}
                />
            </Modal>

            {/* Add Batch Modal */}
            <Modal
                open={addBatchModalOpen}
                onClose={() => setAddBatchModalOpen(false)}
                title={inventoryT('addBatch')}
            >
                <AddBatchForm
                    drugId={drug.id}
                    onSuccess={() => {
                        setAddBatchModalOpen(false);
                        fetchDrugData();
                    }}
                    onCancel={() => setAddBatchModalOpen(false)}
                />
            </Modal>
        </div>
    );
}
