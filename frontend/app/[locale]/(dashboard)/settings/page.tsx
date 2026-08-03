// app/[locale]/(dashboard)/settings/page.tsx
'use client';
import {useState, useEffect} from 'react';
import {useTranslations} from 'next-intl';
import {useAuth} from '@/context/AuthContext';
import {useApi} from '@/hooks/useAPI';
import {Button} from '@/components/ui/Button';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/Card';
import {Input} from '@/components/ui/Input';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Branch, PaginatedResponse} from "@/types";
import {Badge} from "lucide-react";
import {Spinner} from "@/components/ui/Spinner";
import {Switch} from "@/components/ui/Switch";

// ---------- Password change schema ----------
const passwordSchema = z
    .object({
        currentPassword: z.string().min(6),
        newPassword: z.string().min(6),
        confirmPassword: z.string().min(6),
    })
    .refine(data => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export default function SettingsPage() {
    const t = useTranslations('settings');
    const rolesT = useTranslations('roles');
    const commonT = useTranslations('common');
    const msgT = useTranslations('messages');

    const {user} = useAuth();
    const {get, put, patch} = useApi();

    // Password state
    const [pwSuccess, setPwSuccess] = useState('');
    const [pwError, setPwError] = useState('');
    const [pwSubmitting, setPwSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: {errors},
        reset,
    } = useForm({
        resolver: zodResolver(passwordSchema),
    });

    const onChangePassword = async (data: any) => {
        setPwSubmitting(true);
        setPwError('');
        setPwSuccess('');
        try {
            await put('/auth/change-password', {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            setPwSuccess(t('passwordChanged'));
            reset();
        } catch (err: any) {
            setPwError(err.response?.data?.message || msgT('error'));
        } finally {
            setPwSubmitting(false);
        }
    };

    // Franchise state (manager only)
    const [franchise, setFranchise] = useState<number>(0);
    const [franchiseLoading, setFranchiseLoading] = useState<boolean>(false);
    const [franchiseSuccess, setFranchiseSuccess] = useState<string>('');
    const [franchiseError, setFranchiseError] = useState<string>('');

    const [branches, setBranches] = useState<Branch[]>([]);
    const [branchesLoading, setBranchesLoading] = useState(false);

    const isManager = user?.role === 'manager';

    useEffect(() => {
        if (!isManager) return;
        const fetchFranchise = async () => {
            setFranchiseLoading(true);
            const data = await get<{ franchiseAmount: number }>('/settings/franchise');
            if (data) {
                setFranchise(data.franchiseAmount);
            }
            setFranchiseLoading(false);
        };
        fetchFranchise();
    }, [isManager, get]);

    const updateFranchise = async () => {
        if (!isManager) return;
        setFranchiseError('');
        setFranchiseSuccess('');
        try {
            await put('/settings/franchise', {amount: franchise});
            setFranchiseSuccess(t('franchiseUpdated'));
        } catch (err: any) {
            setFranchiseError(err.response?.data?.message || msgT('error'));
        }
    };

    useEffect(() => {
        if (isManager) {
            setBranchesLoading(true);
            get<PaginatedResponse<Branch>>('/branches', {params: {limit: 100}})
                .then(data => {
                    if (data) setBranches(data.items);
                })
                .finally(() => setBranchesLoading(false));
        }
    }, [isManager, get]);

    const toggleBranchFranchise = async (branchId: string) => {
        const result = await patch(`/branches/${branchId}/franchise`);
        if (result) {
            setBranches(prev =>
                prev.map(b => (b.id === branchId ? {...b, hasFranchise: !b.hasFranchise} : b))
            );
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                {t('title')}
            </h1>

            {/* Profile Card */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('profile')}</CardTitle>
                    <CardDescription>{t('profileDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div>
                        <span className="font-medium">{t('fullName')}:</span> {user?.fullName}
                    </div>
                    <div>
                        <span className="font-medium">{t('email')}:</span> {user?.email}
                    </div>
                    <div>
                        <span
                            className="font-medium">{t('role')}:</span> {user?.role ? rolesT(user.role) : ''}
                    </div>
                </CardContent>
            </Card>

            {/* Franchise Fee Card (manager only) */}
            {isManager && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('franchiseTitle')}</CardTitle>
                        <CardDescription>{t('franchiseDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {franchiseError && (
                            <p className="text-red-500 text-sm">{franchiseError}</p>
                        )}
                        {franchiseSuccess && (
                            <p className="text-green-600 text-sm">{franchiseSuccess}</p>
                        )}
                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                            <Input
                                label={t('franchiseAmount')}
                                type="number"
                                min="0"
                                step="0.01"
                                value={franchise || ''}
                                onChange={(e) => setFranchise(Number(e.target.value))}
                                disabled={franchiseLoading}
                            />
                            <Button onClick={updateFranchise} disabled={franchiseLoading}>
                                {commonT('save')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {isManager && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('franchiseBranchListTitle')}</CardTitle>
                        <CardDescription>{t('franchiseBranchListDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {branchesLoading ? (
                            <div className="flex justify-center py-4"><Spinner/></div>
                        ) : branches.length === 0 ? (
                            <p className="text-center text-muted-foreground text-sm">{t('noBranches')}</p>
                        ) : (
                            <div className="max-h-64 overflow-y-auto space-y-2">
                                {branches.map(branch => (
                                    <div key={branch.id}
                                         className="flex items-center justify-between p-2 border rounded-md">
                                        <div>
                                            <span className="text-sm font-medium">{branch.name}</span>
                                        </div>
                                        <Switch
                                            checked={branch.hasFranchise ?? false}
                                            onChange={() => toggleBranchFranchise(branch.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Change Password Card */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('changePassword')}</CardTitle>
                    <CardDescription>{t('changePasswordDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
                        {pwError && <p className="text-red-500 text-sm">{pwError}</p>}
                        {pwSuccess && <p className="text-green-600 text-sm">{pwSuccess}</p>}

                        <Input
                            type="password"
                            label={t('currentPassword')}
                            {...register('currentPassword')}
                            error={errors.currentPassword?.message}
                        />
                        <Input
                            type="password"
                            label={t('newPassword')}
                            {...register('newPassword')}
                            error={errors.newPassword?.message}
                        />
                        <Input
                            type="password"
                            label={t('confirmPassword')}
                            {...register('confirmPassword')}
                            error={errors.confirmPassword?.message}
                        />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={pwSubmitting}>
                                {pwSubmitting ? commonT('saving') : t('updatePassword')}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
