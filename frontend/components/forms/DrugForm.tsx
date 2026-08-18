'use client';
import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useTranslations} from 'next-intl';
import {Input} from '@/components/ui/Input';
import {Button} from '@/components/ui/Button';
import {apiPost, apiPut} from '@/lib/api';
import {Drug} from '@/types';

const drugSchema = z.object({
    name: z.string().min(1, 'Drug name is required'),
    brand: z.string().optional(),
    company: z.string().min(1, 'Company is required'),
    enteringDate: z.string().min(1, 'Entering date is required'),
    titakCode: z.string().optional(),
    insuranceEligible: z.boolean().optional(),
    insuranceCode: z.string().optional(),
});

type DrugFormData = z.infer<typeof drugSchema>;

interface DrugFormProps {
    drug?: Drug | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export function DrugForm({drug, onSuccess, onCancel}: DrugFormProps) {
    const t = useTranslations('inventory');
    const commonT = useTranslations('common');
    const msgT = useTranslations('messages');

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: {errors},
        reset,
        watch,
        setValue,
    } = useForm<DrugFormData>({
        resolver: zodResolver(drugSchema),
        defaultValues: drug
            ? {
                  name: drug.name,
                  brand: drug.brand || '',
                  company: drug.company,
                  enteringDate: drug.enteringDate.split('T')[0],
                  titakCode: drug.titakCode || '',
                  insuranceEligible: drug.insuranceEligible ?? false,
                  insuranceCode: drug.insuranceCode || '',
              }
            : {
                  name: '',
                  brand: '',
                  company: '',
                  enteringDate: new Date().toISOString().split('T')[0],
                  titakCode: '',
                  insuranceEligible: false,
                  insuranceCode: '',
              },
    });

    const insuranceEligible = watch('insuranceEligible');

    useEffect(() => {
        if (drug) {
            reset({
                name: drug.name,
                brand: drug.brand || '',
                company: drug.company,
                enteringDate: drug.enteringDate.split('T')[0],
                titakCode: drug.titakCode || '',
                insuranceEligible: drug.insuranceEligible ?? false,
                insuranceCode: drug.insuranceCode || '',
            });
        }
    }, [drug, reset]);

    const onSubmit = async (data: DrugFormData) => {
        setSubmitting(true);
        setError(null);
        try {
            const payload = {
                ...data,
                insuranceEligible: Boolean(data.insuranceEligible),
                titakCode: data.titakCode || null,
                insuranceCode: data.insuranceCode || null,
            };
            if (drug) {
                await apiPut(`/inventory/drugs/${drug.id}`, payload);
            } else {
                await apiPost('/inventory/drugs', payload);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.message || err.response?.data?.message || msgT('error'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
                <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                    {error}
                </div>
            )}

            <Input label={t('drugName')} {...register('name')} error={errors.name?.message} />
            <Input label={t('brand')} {...register('brand')} error={errors.brand?.message} />
            <Input label={t('company')} {...register('company')} error={errors.company?.message} />
            <Input
                label={t('enteringDate')}
                type="date"
                {...register('enteringDate')}
                error={errors.enteringDate?.message}
            />

            <Input
                label="Titak code"
                {...register('titakCode')}
                error={errors.titakCode?.message}
            />
            <p className="text-xs text-[var(--color-muted-foreground)] -mt-2">
                External ID used by Titak price API. Required for Update price.
            </p>

            <div className="flex items-center gap-2">
                <input
                    id="insuranceEligible"
                    type="checkbox"
                    className="h-4 w-4 rounded border-[var(--color-border)]"
                    checked={Boolean(insuranceEligible)}
                    onChange={(e) => setValue('insuranceEligible', e.target.checked)}
                />
                <label htmlFor="insuranceEligible" className="text-sm font-medium">
                    Insurance eligible
                </label>
            </div>
            <p className="text-xs text-[var(--color-muted-foreground)] -mt-2">
                If unchecked, this drug is never covered by social insurance — patient pays 100%.
            </p>

            <Input
                label="Insurance formulary code"
                {...register('insuranceCode')}
                error={errors.insuranceCode?.message}
            />

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                    {commonT('cancel')}
                </Button>
                <Button type="submit" disabled={submitting}>
                    {submitting ? commonT('saving') : drug ? commonT('save') : commonT('create')}
                </Button>
            </div>
        </form>
    );
}
