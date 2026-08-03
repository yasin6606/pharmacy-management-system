'use client';
import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useTranslations} from 'next-intl';
import {Input} from '@/components/ui/Input';
import {Button} from '@/components/ui/Button';
import {useApi} from '@/hooks/useAPI';
import {Branch} from '@/types';

// ✅ isWarehouse is now required (no .optional())
const branchSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    address: z.string().optional(),
    isWarehouse: z.boolean(),
});

type BranchFormData = z.infer<typeof branchSchema>;

interface BranchFormProps {
    branch?: Branch | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export function BranchForm({branch, onSuccess, onCancel}: BranchFormProps) {
    const t = useTranslations('branches');
    const commonT = useTranslations('common');
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
        // defaultValues matches the schema exactly (all fields required, address optional)
        defaultValues: {
            name: branch?.name ?? '',
            address: branch?.address ?? '',
            isWarehouse: branch?.isWarehouse ?? false,
        },
    });

    useEffect(() => {
        if (branch) {
            reset({
                name: branch.name,
                address: branch.address ?? '',
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
            setError(err.response?.data?.message || commonT('error'));
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
                <label htmlFor="isWarehouse" className="text-sm font-medium text-foreground">
                    {t('isWarehouse')}
                </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                    {commonT('cancel')}
                </Button>
                <Button type="submit" disabled={submitting}>
                    {submitting ? commonT('saving') : commonT('save')}
                </Button>
            </div>
        </form>
    );
}
