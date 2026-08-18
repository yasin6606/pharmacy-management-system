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
import {Branch, PaginatedResponse} from '@/types';
import {Spinner} from '@/components/ui/Spinner';
import {Switch} from '@/components/ui/Switch';
import {formatIRR} from '@/lib/currency';

const passwordSchema = z
    .object({
        currentPassword: z.string().min(6),
        newPassword: z.string().min(6),
        confirmPassword: z.string().min(6),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

type IntegrationRow = {
    key: string;
    configured: boolean;
    value: string;
    isSecret: boolean;
};

const INTEGRATION_LABELS: Record<string, string> = {
    titak_api_key: 'Titak API key',
    titak_base_url: 'Titak base URL',
    insurance_tamin_api_key: 'Tamin (تامین اجتماعی) API key',
    insurance_salamat_api_key: 'Salamat (سلامت) API key',
    insurance_mosalah_api_key: 'Mosalah (نیروهای مسلح) API key',
    insurance_default_coverage_percent: 'Default insurer coverage % (0–100)',
};

export default function SettingsPage() {
    const t = useTranslations('settings');
    const rolesT = useTranslations('roles');
    const commonT = useTranslations('common');
    const msgT = useTranslations('messages');

    const {user} = useAuth();
    const {get, put, patch} = useApi();

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
            setPwError(err.message || msgT('error'));
        } finally {
            setPwSubmitting(false);
        }
    };

    const [franchise, setFranchise] = useState<number>(0);
    const [franchiseLoading, setFranchiseLoading] = useState(false);
    const [franchiseSuccess, setFranchiseSuccess] = useState('');
    const [franchiseError, setFranchiseError] = useState('');

    const [branches, setBranches] = useState<Branch[]>([]);
    const [branchesLoading, setBranchesLoading] = useState(false);

    const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);
    const [integrationDrafts, setIntegrationDrafts] = useState<Record<string, string>>({});
    const [integrationsLoading, setIntegrationsLoading] = useState(false);
    const [integrationsMsg, setIntegrationsMsg] = useState('');
    const [integrationsErr, setIntegrationsErr] = useState('');

    const isManager = user?.role === 'manager';

    useEffect(() => {
        if (!isManager) return;
        setFranchiseLoading(true);
        get<{franchiseAmount: number}>('/settings/franchise')
            .then((data) => {
                if (data) setFranchise(data.franchiseAmount);
            })
            .finally(() => setFranchiseLoading(false));
    }, [isManager, get]);

    useEffect(() => {
        if (!isManager) return;
        setBranchesLoading(true);
        get<PaginatedResponse<Branch>>('/branches', {params: {limit: 100}})
            .then((data) => {
                if (data) setBranches(data.items);
            })
            .finally(() => setBranchesLoading(false));
    }, [isManager, get]);

    useEffect(() => {
        if (!isManager) return;
        setIntegrationsLoading(true);
        get<IntegrationRow[]>('/settings/integrations')
            .then((data) => {
                if (data) {
                    setIntegrations(data);
                    const drafts: Record<string, string> = {};
                    data.forEach((row) => {
                        drafts[row.key] = row.isSecret ? '' : row.value;
                    });
                    setIntegrationDrafts(drafts);
                }
            })
            .finally(() => setIntegrationsLoading(false));
    }, [isManager, get]);

    const updateFranchise = async () => {
        if (!isManager) return;
        setFranchiseError('');
        setFranchiseSuccess('');
        try {
            await put('/settings/franchise', {amount: franchise});
            setFranchiseSuccess(t('franchiseUpdated'));
        } catch (err: any) {
            setFranchiseError(err.message || msgT('error'));
        }
    };

    const toggleBranchFranchise = async (branchId: string) => {
        const result = await patch(`/branches/${branchId}/franchise`);
        if (result) {
            setBranches((prev) =>
                prev.map((b) => (b.id === branchId ? {...b, hasFranchise: !b.hasFranchise} : b))
            );
        }
    };

    const saveIntegrations = async () => {
        setIntegrationsErr('');
        setIntegrationsMsg('');
        const entries = Object.entries(integrationDrafts).map(([key, value]) => ({key, value}));
        const data = await put<IntegrationRow[]>('/settings/integrations', {entries});
        if (data) {
            setIntegrations(data);
            setIntegrationsMsg('Integration settings saved');
            const drafts: Record<string, string> = {};
            data.forEach((row) => {
                drafts[row.key] = row.isSecret ? '' : row.value;
            });
            setIntegrationDrafts(drafts);
        } else {
            setIntegrationsErr(msgT('error'));
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
            <h1 className="page-title text-xl sm:text-2xl md:text-3xl text-[var(--color-foreground)]">
                {t('title')}
            </h1>

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
                        <span className="font-medium">{t('role')}:</span>{' '}
                        {user?.role ? rolesT(user.role) : ''}
                    </div>
                </CardContent>
            </Card>

            {isManager && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('franchiseTitle')}</CardTitle>
                        <CardDescription>{t('franchiseDescription')} (IRR)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {franchiseError && <p className="text-red-500 text-sm">{franchiseError}</p>}
                        {franchiseSuccess && <p className="text-green-600 text-sm">{franchiseSuccess}</p>}
                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                            <Input
                                label={`${t('franchiseAmount')} (IRR)`}
                                type="number"
                                min="0"
                                step="1"
                                value={franchise || ''}
                                onChange={(e) => setFranchise(Number(e.target.value))}
                                disabled={franchiseLoading}
                            />
                            <Button onClick={updateFranchise} disabled={franchiseLoading}>
                                {commonT('save')}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatIRR(franchise)}</p>
                    </CardContent>
                </Card>
            )}

            {isManager && (
                <Card>
                    <CardHeader>
                        <CardTitle>Integrations (Titak & Insurance)</CardTitle>
                        <CardDescription>
                            Paste API keys from your contracts. Secrets are stored server-side and masked in the UI.
                            Leave a secret field blank to keep the existing value.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {integrationsLoading ? (
                            <div className="flex justify-center py-6">
                                <Spinner />
                            </div>
                        ) : (
                            integrations.map((row) => (
                                <div key={row.key} className="space-y-1">
                                    <Input
                                        label={
                                            INTEGRATION_LABELS[row.key] || row.key +
                                            (row.configured && row.isSecret ? ' (configured)' : '')
                                        }
                                        type={row.isSecret ? 'password' : 'text'}
                                        placeholder={row.isSecret ? (row.configured ? '•••• (unchanged if empty)' : 'Paste key') : ''}
                                        value={integrationDrafts[row.key] ?? ''}
                                        onChange={(e) =>
                                            setIntegrationDrafts((prev) => ({
                                                ...prev,
                                                [row.key]: e.target.value,
                                            }))
                                        }
                                        autoComplete="off"
                                    />
                                </div>
                            ))
                        )}
                        {integrationsErr && <p className="text-red-500 text-sm">{integrationsErr}</p>}
                        {integrationsMsg && <p className="text-green-600 text-sm">{integrationsMsg}</p>}
                        <div className="flex justify-end">
                            <Button onClick={saveIntegrations}>{commonT('save')}</Button>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Iranian insurer APIs (Tamin, Salamat, Mosalah) are contract-based — keys are issued only to
                            licensed pharmacies by each organization. This app cannot provide those keys. After you paste
                            them here, claim/validation adapters can use them.
                        </p>
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
                            <div className="flex justify-center py-4">
                                <Spinner />
                            </div>
                        ) : branches.length === 0 ? (
                            <p className="text-center text-muted-foreground text-sm">{t('noBranches')}</p>
                        ) : (
                            <div className="max-h-64 overflow-y-auto space-y-2">
                                {branches.map((branch) => (
                                    <div
                                        key={branch.id}
                                        className="flex items-center justify-between p-2 border rounded-md"
                                    >
                                        <span className="text-sm font-medium">{branch.name}</span>
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

            <Card>
                <CardHeader>
                    <CardTitle>{t('changePassword')}</CardTitle>
                    <CardDescription>{t('changePasswordDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
                        {pwError && <p className="text-red-500 text-sm">{pwError}</p>}
                        {pwSuccess && <p className="text-green-600 text-sm">{pwSuccess}</p>}
                        <Input type="password" label={t('currentPassword')} {...register('currentPassword')} error={errors.currentPassword?.message as string} />
                        <Input type="password" label={t('newPassword')} {...register('newPassword')} error={errors.newPassword?.message as string} />
                        <Input type="password" label={t('confirmPassword')} {...register('confirmPassword')} error={errors.confirmPassword?.message as string} />
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
