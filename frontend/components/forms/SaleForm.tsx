// components/forms/SaleForm.tsx
'use client';
import {useEffect, useState, useMemo} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useTranslations} from 'next-intl';
import {Input} from '@/components/ui/Input';
import {Button} from '@/components/ui/Button';
import {useApi} from '@/hooks/useAPI';
import {useAuth} from '@/context/AuthContext';
import {DrugBatch} from '@/types';
import {Spinner} from '@/components/ui/Spinner';
import {Search, Package, AlertCircle} from 'lucide-react';

const schema = z.object({
    drugBatchId: z.string().min(1, 'Please select a drug'),
    quantity: z.number().int().positive('Quantity must be positive'),
    prescriptionRef: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function SaleForm({onSuccess}: { onSuccess: () => void }) {
    const t = useTranslations('sales');
    const commonT = useTranslations('common');
    const {user} = useAuth();
    const {get, post} = useApi();

    const [batches, setBatches] = useState<DrugBatch[]>([]);
    const [loadingBatches, setLoadingBatches] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedBatch, setSelectedBatch] = useState<DrugBatch | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const {
        register,
        handleSubmit,
        formState: {errors},
        reset,
        setValue,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    useEffect(() => {
        const fetchBatches = async () => {
            if (!user?.currentBranchId) {
                setLoadingBatches(false);
                return;
            }
            setLoadingBatches(true);
            const data = await get<DrugBatch[]>(
                `/inventory/branches/${user.currentBranchId}/inventory`
            );
            if (data) setBatches(data.filter(b => b.count > 0));
            setLoadingBatches(false);
        };
        fetchBatches();
    }, [user?.currentBranchId, get]);

    const filteredBatches = useMemo(() => {
        if (!search.trim()) return batches;
        const q = search.toLowerCase();
        return batches.filter(b =>
            b.drug?.name?.toLowerCase().includes(q) ||
            b.drug?.company?.toLowerCase().includes(q)
        );
    }, [batches, search]);

    const handleSelectBatch = (batch: DrugBatch) => {
        setSelectedBatch(batch);
        setValue('drugBatchId', batch.id);
        setSearch(batch.drug?.name || '');
        setDropdownOpen(false);
    };

    const onSubmit = async (data: FormData) => {
        if (!selectedBatch) return;
        setSubmitting(true);
        const result = await post('/sales', data);
        setSubmitting(false);
        if (result) {
            reset();
            setSelectedBatch(null);
            setSearch('');
            onSuccess();
        }
    };

    if (!user?.currentBranchId && !loadingBatches) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <AlertCircle className="mx-auto h-8 w-8 mb-3 opacity-70"/>
                <p className="text-sm">{t('noBranchAssigned')}</p>
                <p className="text-xs mt-1">{t('contactManager')}</p>
            </div>
        );
    }

    if (loadingBatches) {
        return <div className="flex justify-center py-12"><Spinner/></div>;
    }

    if (batches.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <Package className="mx-auto h-8 w-8 mb-3 opacity-50"/>
                <p className="text-sm">{t('noStockAvailable')}</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Searchable drug selector */}
            <div className="relative">
                <label className="text-sm font-medium mb-1 block">{t('selectDrug')}</label>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/>
                    <input
                        type="text"
                        className="w-full h-10 pl-9 pr-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder={t('searchPlaceholder')}
                        value={search}
                        onFocus={() => setDropdownOpen(true)}
                        onChange={e => {
                            setSearch(e.target.value);
                            if (!e.target.value) {
                                setSelectedBatch(null);
                                setValue('drugBatchId', '');
                            }
                            setDropdownOpen(true);
                        }}
                    />
                </div>

                {/* Dropdown list */}
                {dropdownOpen && search && !selectedBatch && (
                    <div
                        className="absolute z-20 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-52 overflow-y-auto">
                        {filteredBatches.length === 0 ? (
                            <p className="p-3 text-sm text-muted-foreground">Nothing found</p>
                        ) : (
                            filteredBatches.map(batch => (
                                <button
                                    key={batch.id}
                                    type="button"
                                    className="w-full text-left px-3 py-2 hover:bg-muted flex justify-between items-start text-xs sm:text-sm"
                                    onClick={() => handleSelectBatch(batch)}
                                >
                                    <div>
                                        <div className="font-medium">{batch.drug?.name}</div>
                                        <div className="text-muted-foreground">{batch.drug?.company}</div>
                                    </div>
                                    <div className="text-right ml-3">
                                        <div className="font-semibold">${batch.sellingPrice}</div>
                                        <div className="text-xs text-muted-foreground">Qty: {batch.count}</div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {/* Selected indicator */}
                {selectedBatch && (
                    <div className="mt-2 flex items-center justify-between bg-muted rounded-md px-3 py-2 text-sm">
            <span>
              <strong>{selectedBatch.drug?.name}</strong> – {selectedBatch.drug?.company} (Stock: {selectedBatch.count})
            </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => {
                                setSelectedBatch(null);
                                setSearch('');
                                setValue('drugBatchId', '');
                            }}
                        >
                            Change
                        </Button>
                    </div>
                )}

                {errors.drugBatchId && (
                    <p className="text-xs text-red-500 mt-1">{errors.drugBatchId.message}</p>
                )}
            </div>

            {/* Quantity */}
            <Input
                label={t('quantity')}
                type="number"
                min={1}
                max={selectedBatch?.count || undefined}
                disabled={!selectedBatch}
                {...register('quantity', {valueAsNumber: true})}
                error={errors.quantity?.message}
            />

            {/* Optional prescription */}
            <Input
                label={t('prescriptionRef')}
                {...register('prescriptionRef')}
                error={errors.prescriptionRef?.message}
            />

            <Button
                type="submit"
                className="w-full"
                disabled={submitting || !selectedBatch}
            >
                {submitting ? commonT('processing') : t('recordSale')}
            </Button>
        </form>
    );
}
