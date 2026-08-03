'use client';
import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useTranslations} from 'next-intl';
import {useAuth} from '@/context/AuthContext';
import {Input} from '@/components/ui/Input';
import {Button} from '@/components/ui/Button';
import {Select} from '@/components/ui/Select';
import {useApi} from '@/hooks/useAPI';
import {Drug, PaginatedResponse} from '@/types';
import {Spinner} from '@/components/ui/Spinner';

const lossReportSchema = z.object({
    drugId: z.string().uuid('Please select a drug'),
    quantity: z.number().int().positive('Quantity must be positive'),
    reason: z.string().min(1, 'Reason is required'),
});

type LossReportFormData = z.infer<typeof lossReportSchema>;

interface LossReportFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export function LossReportForm({onSuccess, onCancel}: LossReportFormProps) {
    const t = useTranslations('lossReports');
    const commonT = useTranslations('common');
    const {user} = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [drugs, setDrugs] = useState<Drug[]>([]);
    const [loadingDrugs, setLoadingDrugs] = useState(true);
    const limit = 5000;

    const {get, post} = useApi();

    const {
        register,
        handleSubmit,
        formState: {errors},
        reset,
    } = useForm<LossReportFormData>({
        resolver: zodResolver(lossReportSchema),
        defaultValues: {drugId: '', quantity: 0, reason: ''},
    });

    useEffect(() => {
        const fetchDrugs = async (currentPage: number = 1) => {
            try {
                const params = {page: currentPage, limit};
                const data = await get<PaginatedResponse<Drug>>('/inventory/drugs', {params});
                if (data) setDrugs(data.items);
            } catch {
                setError(commonT('error'));
            } finally {
                setLoadingDrugs(false);
            }
        };
        fetchDrugs();
    }, [commonT]);

    const onSubmit = async (data: LossReportFormData) => {
        setSubmitting(true);
        setError(null);
        try {
            await post('/loss-reports', {
                ...data,
                reportedById: user?.id,
                branchId: user?.currentBranchId,
                quantity: Number(data.quantity),   // ensure number
            });
            reset();
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || commonT('error'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingDrugs) {
        return (
            <div className="flex justify-center py-8">
                <Spinner/>
            </div>
        );
    }

    const drugOptions = drugs.map((d) => ({value: d.id, label: d.name}));

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
                <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                    {error}
                </div>
            )}

            <Select
                label={t('selectDrug')}
                options={drugOptions}
                {...register('drugId')}
                error={errors.drugId?.message}
            />

            <Input
                label={t('quantity')}
                type="number"
                min={1}
                {...register('quantity', {valueAsNumber: true})}
                error={errors.quantity?.message}
            />

            <Input
                label={t('reason')}
                {...register('reason')}
                error={errors.reason?.message}
                placeholder={t('reasonPlaceholder')}
            />

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                    {commonT('cancel')}
                </Button>
                <Button type="submit" disabled={submitting}>
                    {submitting ? commonT('submitting') : t('reportLoss')}
                </Button>
            </div>
        </form>
    );
}
