// components/forms/PatientBasket.tsx
'use client';
import {useState, useEffect, useMemo} from 'react';
import {useTranslations} from 'next-intl';
import {useApi} from '@/hooks/useAPI';
import {useAuth} from '@/context/AuthContext';
import {DrugBatch} from '@/types';
import {Input} from '@/components/ui/Input';
import {Button} from '@/components/ui/Button';
import {Spinner} from '@/components/ui/Spinner';
import {Search, Plus, Minus, X} from 'lucide-react';
import {useFranchise} from '@/hooks/useFranchise';
import {useSalesTabs} from '@/context/SalesTabsContext';

type PaymentMethod = 'cash' | 'transfer' | 'pos' | 'credit';

interface PatientBasketProps {
    tabId: number;
    patientLabel: string;
    onRemoveTab: () => void;
}

export function PatientBasket({tabId, patientLabel, onRemoveTab}: PatientBasketProps) {
    const t = useTranslations('sales');
    const c = useTranslations('common');
    const {user} = useAuth();
    const {get, post} = useApi();
    const {getBasket, updateBasket, clearBasket} = useSalesTabs();

    const basket = getBasket(tabId);

    const [batches, setBatches] = useState<DrugBatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Payment state
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [customerName, setCustomerName] = useState('');
    const [customerFamily, setCustomerFamily] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    // Franchise: use global amount and branch flag from user context
    const franchiseAmount = useFranchise();
    const branchFranchise = user?.currentBranch?.hasFranchise ?? false;

    useEffect(() => {
        if (!user?.currentBranchId) {
            setLoading(false);
            return;
        }
        get<DrugBatch[]>(`/inventory/branches/${user.currentBranchId}/inventory`)
            .then(data => setBatches(data ? data.filter(b => b.count > 0) : []))
            .finally(() => setLoading(false));
    }, [user?.currentBranchId, get]);

    const filteredBatches = useMemo(() => {
        if (!search.trim()) return batches;
        const q = search.toLowerCase();
        return batches.filter(b =>
            b.drug?.name?.toLowerCase().includes(q) ||
            b.drug?.company?.toLowerCase().includes(q)
        );
    }, [batches, search]);

    const addToBasket = (batch: DrugBatch) => {
        const existing = basket.find(i => i.batch.id === batch.id);
        if (existing) {
            const newQty = existing.quantity + 1;
            if (newQty > batch.count) return;
            const updated = basket.map(i =>
                i.batch.id === batch.id ? {...i, quantity: newQty} : i
            );
            updateBasket(tabId, updated);
        } else {
            updateBasket(tabId, [...basket, {batch, quantity: 1}]);
        }
    };

    const updateQuantity = (batchId: string, delta: number) => {
        const newBasket = basket
            .map(i => {
                if (i.batch.id !== batchId) return i;
                const newQty = i.quantity + delta;
                if (newQty < 1 || newQty > i.batch.count) return i;
                return {...i, quantity: newQty};
            })
            .filter(i => i.quantity > 0);
        updateBasket(tabId, newBasket);
    };

    const removeItem = (batchId: string) => {
        updateBasket(tabId, basket.filter(i => i.batch.id !== batchId));
    };

    // Totals: franchise fee only if branch has it enabled
    const total = basket.reduce((sum, i) => sum + (i.batch.sellingPrice ?? 0) * i.quantity, 0);
    const franchiseFee = branchFranchise ? franchiseAmount : 0;
    const totalWithFranchise = total + franchiseFee;

    const handleCompleteSale = async () => {
        if (basket.length === 0) return;

        setSubmitting(true);
        const items = basket.map(i => ({
            drugBatchId: i.batch.id,
            quantity: i.quantity,
            prescriptionRef: i.prescriptionRef,
        }));

        // Build payment payload
        const paymentPayload: any = {method: paymentMethod};
        if (paymentMethod === 'credit') {
            paymentPayload.customerName = customerName || undefined;
            paymentPayload.customerFamily = customerFamily || undefined;
            paymentPayload.customerPhone = customerPhone || undefined;
        }

        const result = await post('/sales/batch', {items, payment: paymentPayload});
        setSubmitting(false);
        if (result) {
            clearBasket(tabId);
            onRemoveTab();
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Two‑column content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 flex-1 min-h-0">
                {/* Left: Available drugs */}
                <div className="flex flex-col min-h-0">
                    <div className="relative mb-3">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                        <Input
                            placeholder={t('searchPlaceholder')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-8 text-xs sm:text-sm"
                        />
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12"><Spinner/></div>
                    ) : (
                        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                            {filteredBatches.map(batch => (
                                <button
                                    key={batch.id}
                                    type="button"
                                    className="w-full text-left px-3 py-2 border-2 border-border rounded-md hover:bg-muted transition-colors text-xs sm:text-sm flex justify-between items-start"
                                    onClick={() => addToBasket(batch)}
                                >
                                    <div>
                                        <div className="font-medium">{batch.drug?.name}</div>
                                        <div className="text-muted-foreground">{batch.drug?.company}</div>
                                    </div>
                                    <div className="text-right ml-3">
                                        <div className="font-semibold">${batch.sellingPrice}</div>
                                        <div className="text-xs">Stock: {batch.count}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Basket */}
                <div className="border-2 border-border rounded-lg p-3 flex flex-col min-h-0">
                    <h3 className="text-sm font-medium mb-2">
                        {t('basket')} ({basket.length})
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {basket.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-8">{t('emptyBasket')}</p>
                        ) : (
                            basket.map(item => (
                                <div
                                    key={item.batch.id}
                                    className="flex items-center justify-between text-xs border-b border-border pb-1 last:border-0"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{item.batch.drug?.name}</div>
                                        <div className="text-muted-foreground">
                                            ${item.batch.sellingPrice} × {item.quantity}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 ml-2">
                                        <Button variant="ghost" size="icon" className="h-5 w-5"
                                                onClick={() => updateQuantity(item.batch.id, -1)}>
                                            <Minus className="h-3 w-3"/>
                                        </Button>
                                        <span className="w-4 text-center">{item.quantity}</span>
                                        <Button variant="ghost" size="icon" className="h-5 w-5"
                                                onClick={() => updateQuantity(item.batch.id, 1)}>
                                            <Plus className="h-3 w-3"/>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 text-red-500"
                                                onClick={() => removeItem(item.batch.id)}>
                                            <X className="h-3 w-3"/>
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom: Payment method selection + totals */}
            <div className="border-t-4 border-primary p-4 space-y-3">
                <h3 className="text-sm font-medium">{t('paymentMethod')}</h3>
                <div className="flex flex-wrap gap-2">
                    {(['cash', 'transfer', 'pos', 'credit'] as PaymentMethod[]).map(method => (
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

                {/* Credit customer info */}
                {paymentMethod === 'credit' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                        <Input
                            label={t('customerName')}
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            placeholder={t('customerNamePlaceholder')}
                        />
                        <Input
                            label={t('customerFamily')}
                            value={customerFamily}
                            onChange={e => setCustomerFamily(e.target.value)}
                            placeholder={t('customerFamilyPlaceholder')}
                        />
                        <Input
                            label={t('customerPhone')}
                            value={customerPhone}
                            onChange={e => setCustomerPhone(e.target.value)}
                            placeholder={t('customerPhonePlaceholder')}
                        />
                    </div>
                )}

                {/* POS payment button */}
                {paymentMethod === 'pos' && (
                    <div className="mt-2">
                        <Button variant="outline" onClick={() => alert(t('posInitiateMessage'))}>
                            {t('initiatePos')}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">{t('posDescription')}</p>
                    </div>
                )}

                {/* Totals */}
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('subtotal')}</span>
                    <span>${total.toFixed(2)}</span>
                </div>
                {branchFranchise && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t('franchiseFee')}</span>
                        <span>${franchiseFee.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between font-semibold text-sm">
                    <span>{t('total')}</span>
                    <span>${totalWithFranchise.toFixed(2)}</span>
                </div>
                <Button
                    className="w-full mt-2"
                    onClick={handleCompleteSale}
                    disabled={submitting || basket.length === 0}
                >
                    {submitting ? c('saving') : t('completeSale')}
                </Button>
            </div>
        </div>
    );
}
