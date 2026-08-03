// components/forms/EmployeeForm.tsx
'use client';
import {useEffect, useState} from 'react';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useTranslations} from 'next-intl';
import {Input} from '@/components/ui/Input';
import {Button} from '@/components/ui/Button';
import {Select} from '@/components/ui/Select';
import {Spinner} from '@/components/ui/Spinner';
import {Branch, PaginatedResponse, User} from '@/types';
import {useApi} from '@/hooks/useAPI';
import type {SubmitHandler} from 'react-hook-form';

interface EmployeeFormProps {
    employee?: User | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export function EmployeeForm({employee, onSuccess, onCancel}: EmployeeFormProps) {
    const t = useTranslations('employees');
    const commonT = useTranslations('common');
    const rolesT = useTranslations('roles');

    const [branches, setBranches] = useState<Branch[]>([]);
    const [loadingBranches, setLoadingBranches] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const limit: number = 10;

    const {get, post, put} = useApi();

    // Schema – currentBranchId is optional string, no transform
    const schema = z.object({
        email: z.string().email(t('invalidEmail')),
        password: z.string().optional(),
        fullName: z.string().min(1, t('fullNameRequired')),
        role: z.enum(['junior', 'senior', 'manager', 'accountant']),
        currentBranchId: z.string().optional(),
    });

    type FormData = z.infer<typeof schema>;

    const {
        control,
        register,
        handleSubmit,
        formState: {errors},
        reset,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            email: employee?.email || '',
            password: '',
            fullName: employee?.fullName || '',
            role: employee?.role || 'junior',
            currentBranchId: employee?.currentBranchId ?? '',   // empty string
        },
    });

    useEffect(() => {
        const loadBranches = async (currentPage: number = 1) => {
            const params = {page: currentPage, limit};
            const data = await get<PaginatedResponse<Branch>>('/branches', {params});

            if (data) setBranches(data.items);

            setLoadingBranches(false);
        };

        loadBranches();
    }, [get]);

    useEffect(() => {
        if (employee) {
            reset({
                email: employee.email,
                password: '',
                fullName: employee.fullName,
                role: employee.role,
                currentBranchId: employee.currentBranchId ?? '',
            });
        }
    }, [employee, reset]);

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setSubmitting(true);

        // Require password for new employees
        if (!employee && !data.password) {
            setSubmitting(false);
            alert(t('passwordMinLength'));
            return;
        }

        const payload: any = {...data};

        // Remove empty password on edit
        if (employee && !payload.password) {
            delete payload.password;
        }

        // Convert empty branchId to null
        payload.currentBranchId = payload.currentBranchId && payload.currentBranchId !== ''
            ? payload.currentBranchId
            : null;

        const result = employee
            ? await put(`/employees/${employee.id}`, payload)
            : await post('/employees', payload);

        setSubmitting(false);
        if (result) {
            onSuccess();
        }
    };

    const roleOptions = [
        {value: 'junior', label: rolesT('junior')},
        {value: 'senior', label: rolesT('senior')},
        {value: 'manager', label: rolesT('manager')},
        {value: 'accountant', label: rolesT('accountant')},
    ];

    const branchOptions = [
        {value: '', label: t('noBranch')},
        ...branches.map((b) => ({value: b.id, label: b.name})),
    ];

    if (loadingBranches) {
        return (
            <div className="flex justify-center py-8">
                <Spinner/>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
                label={t('fullName')}
                {...register('fullName')}
                error={errors.fullName?.message}
                autoComplete="name"
            />
            <Input
                label={t('email')}
                type="email"
                {...register('email')}
                error={errors.email?.message}
                autoComplete="email"
            />
            <Input
                label={employee ? t('newPasswordOptional') : t('password')}
                type="password"
                {...register('password')}
                error={errors.password?.message}
                autoComplete="new-password"
            />
            <Select
                label={t('role')}
                options={roleOptions}
                {...register('role')}
                error={errors.role?.message}
            />

            <Controller
                name="currentBranchId"
                control={control}
                render={({field}) => (
                    <Select
                        label={t('branchAssignment')}
                        options={branchOptions}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                        error={errors.currentBranchId?.message}
                    />
                )}
            />

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                    {commonT('cancel')}
                </Button>
                <Button type="submit" disabled={submitting}>
                    {submitting ? commonT('saving') : employee ? commonT('save') : commonT('create')}
                </Button>
            </div>
        </form>
    );
}
