'use client';
import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useTranslations} from 'next-intl';
import {Input} from '@/components/ui/Input';
import {Button} from '@/components/ui/Button';
import {Select} from '@/components/ui/Select';
import {useApi} from "@/hooks/useAPI";
import {Branch, PaginatedResponse} from '@/types';
import {Spinner} from '@/components/ui/Spinner';

const addBatchSchema = z.object({
    branchId: z.string().uuid('Please select a branch'),
    expirationDate: z.string().min(1, 'Expiration date is required'),
    count: z.number().int().min(0, 'Count must be non-negative'),
    isOffer: z.boolean(),
    exchangedQuantity: z.number().int().min(0),
    purchasePrice: z.number().positive().optional().nullable(),
    sellingPrice: z.number().positive().optional().nullable(),
});

type AddBatchFormData = z.infer<typeof addBatchSchema>;

interface AddBatchFormProps {
    drugId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function AddBatchForm({drugId, onSuccess, onCancel}: AddBatchFormProps) {
    const t = useTranslations('inventory');
    const commonT = useTranslations('common');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loadingBranches, setLoadingBranches] = useState(true);
    const limit = 1000;

    const {get, post} = useApi();

    const {
        register,
        handleSubmit,
        formState: {errors},
        reset,
    } = useForm<AddBatchFormData>({
        resolver: zodResolver(addBatchSchema),
        defaultValues: {
            branchId: '',
            expirationDate: '',
            count: 0,
            isOffer: false,
            exchangedQuantity: 0,
            purchasePrice: undefined,
            sellingPrice: undefined,
        },
    });

    useEffect(() => {
        const fetchBranches = async (currentPage: number=1) => {
            try {
                const params = {page: currentPage, limit};
                const data = await get<PaginatedResponse<Branch>>('/branches', {params});
                if (data) setBranches(data.items);
            } catch {
                setError(commonT('error'));
            } finally {
                setLoadingBranches(false);
            }
        };
        fetchBranches();
    }, [commonT]);

    const onSubmit = async (data: AddBatchFormData) => {
        setSubmitting(true);
        setError(null);
        try {
            // Ensure all numbers are sent as numbers (string → number conversion done by react-hook-form via valueAsNumber)
            const payload = {
                ...data,
                drugId,
                count: Number(data.count),
                exchangedQuantity: Number(data.exchangedQuantity),
                purchasePrice: data.purchasePrice ? Number(data.purchasePrice) : undefined,
                sellingPrice: data.sellingPrice ? Number(data.sellingPrice) : undefined,
            };
            await post('/inventory/batches', payload);
            reset();
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || commonT('error'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingBranches) {
        return (
            <div className="flex justify-center py-8">
                <Spinner/>
            </div>
        );
    }

    const branchOptions = branches.map((b) => ({value: b.id, label: b.name}));

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
                <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                    {error}
                </div>
            )}

            <Select
                label={t('branch')}
                options={branchOptions}
                {...register('branchId')}
                error={errors.branchId?.message}
            />

            <Input
                label={t('expirationDate')}
                type="date"
                {...register('expirationDate')}
                error={errors.expirationDate?.message}
            />

            <Input
                label={t('stock')}
                type="number"
                min={0}
                {...register('count', {valueAsNumber: true})}
                error={errors.count?.message}
            />

            <Input
                label={t('purchasePrice')}
                type="number"
                step="0.01"
                min={0}
                {...register('purchasePrice', {valueAsNumber: true})}
                error={errors.purchasePrice?.message}
            />

            <Input
                label={t('sellingPrice')}
                type="number"
                step="0.01"
                min={0}
                {...register('sellingPrice', {valueAsNumber: true})}
                error={errors.sellingPrice?.message}
            />

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="isOffer"
                    {...register('isOffer')}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isOffer" className="text-sm font-medium text-foreground">
                    {t('offer')}
                </label>
            </div>

            <Input
                label={t('exchangedQuantity')}
                type="number"
                min={0}
                {...register('exchangedQuantity', {valueAsNumber: true})}
                error={errors.exchangedQuantity?.message}
            />

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                    {commonT('cancel')}
                </Button>
                <Button type="submit" disabled={submitting}>
                    {submitting ? commonT('saving') : t('addBatch')}
                </Button>
            </div>
        </form>
    );
}
