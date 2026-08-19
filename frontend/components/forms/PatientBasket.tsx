'use client';
import {useState, useEffect, useMemo} from 'react';
import {useTranslations, useLocale} from 'next-intl';
import {useApi} from '@/hooks/useAPI';
import {useAuth} from '@/context/AuthContext';
import {DrugBatch} from '@/types';
import {Input} from '@/components/ui/Input';
import {Button} from '@/components/ui/Button';
import {Spinner} from '@/components/ui/Spinner';
import {Search, Plus, Minus, X, CreditCard, CheckCircle2} from 'lucide-react';
import {useFranchise} from '@/hooks/useFranchise';
import {useSalesTabs} from '@/context/SalesTabsContext';
import {formatIRR} from '@/lib/currency';

type PaymentMethod = 'cash' | 'transfer' | 'pos' | 'credit';
type InsuranceProvider = 'none' | 'tamin' | 'salamat' | 'mosalah' | 'other';

interface PatientBasketProps {
    tabId: number;
    patientLabel: string;
    onRemoveTab: () => void;
}

export function PatientBasket({tabId, patientLabel, onRemoveTab}: PatientBasketProps) {
    const t = useTranslations('sales');
    const c = useTranslations('common');
    const locale = useLocale() as 'fa' | 'en';
    const {user} = useAuth();
    const {get, post} = useApi();
    const {getBasket, updateBasket, clearBasket} = useSalesTabs();

    const basket = getBasket(tabId);

    const [batches, setBatches] = useState<DrugBatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [customerName, setCustomerName] = useState('');
    const [customerFamily, setCustomerFamily] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    const [insuranceProvider, setInsuranceProvider] = useState<InsuranceProvider>('none');
    const [insuranceMemberId, setInsuranceMemberId] = useState('');
    const coveragePercent = 70;

    // POS state machine: idle → pending → approved
    const [posReference, setPosReference] = useState('');
    const [posStatus, setPosStatus] = useState<'idle' | 'pending' | 'approved' | 'failed'>('idle');
    const [posBusy, setPosBusy] = useState(false);
    const [posMessage, setPosMessage] = useState('');

    const franchiseAmount = useFranchise();
    const branchFranchise = user?.currentBranch?.hasFranchise ?? false;

    useEffect(() => {
        if (!user?.currentBranchId) {
            setLoading(false);
            return;
        }
        get<DrugBatch[]>(`/inventory/branches/${user.currentBranchId}/inventory`)
            .then((data) => setBatches(data ? data.filter((b) => b.count > 0) : []))
            .finally(() => setLoading(false));
    }, [user?.currentBranchId, get]);

    // Reset POS when leaving POS method or changing total
    useEffect(() => {
        if (paymentMethod !== 'pos') {
            setPosReference('');
            setPosStatus('idle');
            setPosMessage('');
        }
    }, [paymentMethod]);

    const filteredBatches = useMemo(() => {
        if (!search.trim()) return batches;
        const q = search.toLowerCase();
        return batches.filter(
            (b) =>
                b.drug?.name?.toLowerCase().includes(q) ||
                b.drug?.company?.toLowerCase().includes(q)
        );
    }, [batches, search]);

    const addToBasket = (batch: DrugBatch) => {
        const existing = basket.find((i) => i.batch.id === batch.id);
        if (existing) {
            const newQty = existing.quantity + 1;
            if (newQty > batch.count) return;
            updateBasket(
                tabId,
                basket.map((i) => (i.batch.id === batch.id ? {...i, quantity: newQty} : i))
            );
        } else {
            updateBasket(tabId, [...basket, {batch, quantity: 1}]);
        }
    };

    const updateQuantity = (batchId: string, delta: number) => {
        const newBasket = basket
            .map((i) => {
                if (i.batch.id !== batchId) return i;
                const newQty = i.quantity + delta;
                if (newQty < 1 || newQty > i.batch.count) return i;
                return {...i, quantity: newQty};
            })
            .filter((i) => i.quantity > 0);
        updateBasket(tabId, newBasket);
    };

    const removeItem = (batchId: string) => {
        updateBasket(
            tabId,
            basket.filter((i) => i.batch.id !== batchId)
        );
    };

    const subtotal = basket.reduce((sum, i) => sum + (i.batch.sellingPrice ?? 0) * i.quantity, 0);
    const franchiseFee = branchFranchise ? franchiseAmount : 0;

    const insuranceCoverage = useMemo(() => {
        if (insuranceProvider === 'none') return 0;
        return basket.reduce((sum, i) => {
            const eligible = Boolean(i.batch.drug?.insuranceEligible);
            if (!eligible) return sum;
            const line = (i.batch.sellingPrice ?? 0) * i.quantity;
            return sum + Math.round((line * coveragePercent) / 100);
        }, 0);
    }, [basket, insuranceProvider, coveragePercent]);

    const patientShare = subtotal - insuranceCoverage + franchiseFee;

    const initiatePos = async () => {
        if (patientShare <= 0 || basket.length === 0) return;
        setPosBusy(true);
        setPosMessage('');
        const data = await post<{
            referenceCode: string;
            amount: number;
            message?: string;
        }>('/integrations/pos/initiate', {amount: Math.round(patientShare)});
        setPosBusy(false);
        if (data?.referenceCode) {
            setPosReference(data.referenceCode);
            setPosStatus('pending');
            setPosMessage(data.message || 'Waiting for terminal approval…');
        } else {
            setPosStatus('failed');
            setPosMessage('Could not start POS session');
        }
    };

    const confirmPos = async (approved: boolean) => {
        if (!posReference) return;
        setPosBusy(true);
        const data = await post<{success: boolean; referenceCode: string; message?: string}>(
            '/integrations/pos/confirm',
            {referenceCode: posReference, approved}
        );
        setPosBusy(false);
        if (approved && data?.success !== false) {
            setPosStatus('approved');
            setPosMessage(data?.message || 'Card payment approved');
        } else {
            setPosStatus('failed');
            setPosMessage(data?.message || 'POS declined');
            setPosReference('');
        }
    };

    const handleCompleteSale = async () => {
        if (basket.length === 0) return;
        if (insuranceProvider !== 'none' && !insuranceMemberId.trim()) return;
        if (paymentMethod === 'pos' && posStatus !== 'approved') return;

        setSubmitting(true);
        const items = basket.map((i) => ({
            drugBatchId: i.batch.id,
            quantity: i.quantity,
            prescriptionRef: i.prescriptionRef,
        }));

        const paymentPayload: Record<string, unknown> = {
            method: paymentMethod,
            insuranceProvider,
            insuranceMemberId: insuranceProvider !== 'none' ? insuranceMemberId.trim() : undefined,
        };
        if (paymentMethod === 'credit') {
            paymentPayload.customerName = customerName || undefined;
            paymentPayload.customerFamily = customerFamily || undefined;
            paymentPayload.customerPhone = customerPhone || undefined;
        }
        if (paymentMethod === 'pos') {
            paymentPayload.posReference = posReference;
        }

        const result = await post('/sales/batch', {items, payment: paymentPayload});
        setSubmitting(false);
        if (result) {
            clearBasket(tabId);
            onRemoveTab();
        }
    };

    const canComplete =
        !submitting &&
        basket.length > 0 &&
        !(insuranceProvider !== 'none' && !insuranceMemberId.trim()) &&
        !(paymentMethod === 'pos' && posStatus !== 'approved');

    return (
        <div className="flex flex-col h-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 flex-1 min-h-0">
                <div className="flex flex-col min-h-0">
                    <div className="relative mb-3">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('searchPlaceholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 text-xs sm:text-sm"
                        />
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Spinner />
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                            {filteredBatches.map((batch) => (
                                <button
                                    key={batch.id}
                                    type="button"
                                    className="w-full text-left px-3 py-2 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-muted)] transition-colors text-xs sm:text-sm flex justify-between items-start"
                                    onClick={() => addToBasket(batch)}
                                >
                                    <div>
                                        <div className="font-medium">{batch.drug?.name}</div>
                                        <div className="text-muted-foreground">{batch.drug?.company}</div>
                                        {batch.drug?.insuranceEligible ? (
                                            <span className="text-[10px] text-emerald-600">Insurance OK</span>
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground">Cash only</span>
                                        )}
                                    </div>
                                    <div className="text-right ml-3">
                                        <div className="font-semibold tabular-nums">
                                            {formatIRR(batch.sellingPrice, locale)}
                                        </div>
                                        <div className="text-xs">Stock: {batch.count}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border border-[var(--color-border)] rounded-xl p-3 flex flex-col min-h-0">
                    <h3 className="text-sm font-medium mb-2">
                        {t('basket')} ({basket.length}) · {patientLabel}
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {basket.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-8">{t('emptyBasket')}</p>
                        ) : (
                            basket.map((item) => (
                                <div
                                    key={item.batch.id}
                                    className="flex items-center justify-between text-xs border-b border-border pb-1 last:border-0"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{item.batch.drug?.name}</div>
                                        <div className="text-muted-foreground tabular-nums">
                                            {formatIRR(item.batch.sellingPrice, locale)} × {item.quantity}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 ml-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5"
                                            onClick={() => updateQuantity(item.batch.id, -1)}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-4 text-center">{item.quantity}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5"
                                            onClick={() => updateQuantity(item.batch.id, 1)}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 text-red-500"
                                            onClick={() => removeItem(item.batch.id)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="border-t border-[var(--color-border)] p-4 space-y-3">
                <h3 className="text-sm font-medium">{t('paymentMethod')}</h3>
                <div className="flex flex-wrap gap-2">
                    {(['cash', 'transfer', 'pos', 'credit'] as PaymentMethod[]).map((method) => (
                        <Button
                            key={method}
                            variant={paymentMethod === method ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPaymentMethod(method)}
                        >
                            {t(`payment.${method}`)}
                        </Button>
                    ))}
                </div>

                {paymentMethod === 'credit' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                        <Input
                            label={t('customerName')}
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                        />
                        <Input
                            label={t('customerFamily')}
                            value={customerFamily}
                            onChange={(e) => setCustomerFamily(e.target.value)}
                        />
                        <Input
                            label={t('customerPhone')}
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                    </div>
                )}

                {paymentMethod === 'pos' && (
                    <div className="rounded-xl border border-[var(--color-border)] p-3 space-y-2 bg-[var(--color-muted)]/30">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <CreditCard className="h-4 w-4" />
                            Card terminal (POS)
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Charge patient share {formatIRR(patientShare, locale)} on the terminal, then confirm.
                        </p>
                        {posStatus === 'idle' && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={posBusy || patientShare <= 0 || basket.length === 0}
                                onClick={initiatePos}
                            >
                                {posBusy ? c('loading') : t('initiatePos')}
                            </Button>
                        )}
                        {posStatus === 'pending' && (
                            <div className="space-y-2">
                                <p className="text-xs font-mono">Ref: {posReference}</p>
                                <p className="text-xs text-amber-600 dark:text-amber-400">{posMessage}</p>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={posBusy}
                                        onClick={() => confirmPos(true)}
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Terminal approved
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={posBusy}
                                        onClick={() => confirmPos(false)}
                                    >
                                        Cancel / decline
                                    </Button>
                                </div>
                            </div>
                        )}
                        {posStatus === 'approved' && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {posMessage} · {posReference}
                            </p>
                        )}
                        {posStatus === 'failed' && (
                            <div className="space-y-2">
                                <p className="text-xs text-red-500">{posMessage}</p>
                                <Button type="button" size="sm" variant="outline" onClick={initiatePos} disabled={posBusy}>
                                    Retry POS
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Patient insurance</h3>
                    <div className="flex flex-wrap gap-2">
                        {(
                            [
                                ['none', 'None'],
                                ['tamin', 'Tamin'],
                                ['salamat', 'Salamat'],
                                ['mosalah', 'Mosalah'],
                                ['other', 'Other'],
                            ] as [InsuranceProvider, string][]
                        ).map(([id, label]) => (
                            <Button
                                key={id}
                                variant={insuranceProvider === id ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setInsuranceProvider(id)}
                            >
                                {label}
                            </Button>
                        ))}
                    </div>
                    {insuranceProvider !== 'none' && (
                        <Input
                            label="Insurance member ID"
                            value={insuranceMemberId}
                            onChange={(e) => setInsuranceMemberId(e.target.value)}
                            placeholder="Booklet / electronic ID"
                        />
                    )}
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('subtotal')}</span>
                    <span className="tabular-nums">{formatIRR(subtotal, locale)}</span>
                </div>
                {insuranceProvider !== 'none' && (
                    <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400">
                        <span>Insurance share (~{coveragePercent}%)</span>
                        <span className="tabular-nums">−{formatIRR(insuranceCoverage, locale)}</span>
                    </div>
                )}
                {branchFranchise && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t('franchiseFee')}</span>
                        <span className="tabular-nums">{formatIRR(franchiseFee, locale)}</span>
                    </div>
                )}
                <div className="flex justify-between font-semibold text-sm">
                    <span>Patient pays</span>
                    <span className="tabular-nums">{formatIRR(patientShare, locale)}</span>
                </div>
                <Button className="w-full mt-2" onClick={handleCompleteSale} disabled={!canComplete}>
                    {submitting ? c('saving') : t('completeSale')}
                </Button>
                {paymentMethod === 'pos' && posStatus !== 'approved' && basket.length > 0 && (
                    <p className="text-[11px] text-center text-muted-foreground">
                        Complete the POS approval before finishing the sale.
                    </p>
                )}
            </div>
        </div>
    );
}
