'use client';
import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {useAuth} from '@/context/AuthContext';
import {useSalesTabs} from '@/context/SalesTabsContext';
import {useApi} from '@/hooks/useAPI';
import {PaginatedResponse, Sale} from '@/types';
import {Button} from '@/components/ui/Button';
import {PatientBasket} from '@/components/forms/PatientBasket';
import {UserPlus, ShoppingCart, TrendingUp} from 'lucide-react';
import {useRouter} from '@/navigation';

export default function SalesPage() {
    const t = useTranslations('sales');
    const {user} = useAuth();
    const {tabs, activeTabId, addTab, removeTab, setActiveTabId} = useSalesTabs();
    const router = useRouter();
    const {get} = useApi();

    const [todayStats, setTodayStats] = useState({count: 0, total: 0});

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        get<PaginatedResponse<Sale>>('/sales', {params: {startDate: today, endDate: today, limit: 1}})
            .then(data => {
                if (data) {
                    setTodayStats({
                        count: data.total,
                        total: data.items.reduce((sum, s) => sum + Number(s.totalPrice), 0)
                    });
                }
            });
    }, [get]);

    // Refresh stats after a sale (called when a tab is closed after sale)
    const refreshStats = () => {
        const today = new Date().toISOString().split('T')[0];
        get<PaginatedResponse<Sale>>('/sales', {params: {startDate: today, endDate: today, limit: 1}})
            .then(data => {
                if (data) {
                    setTodayStats({
                        count: data.total,
                        total: data.items.reduce((sum, s) => sum + Number(s.totalPrice), 0)
                    });
                }
            });
    };

    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-4rem)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('newSale')}</h1>
                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4"/> {t('todayTotal')}: ${todayStats.total.toFixed(2)}
            </span>
                        <span className="flex items-center gap-1">
              <ShoppingCart className="h-4 w-4"/> {todayStats.count} {t('sales')}
            </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {user?.currentBranchId && (
                        <Button onClick={addTab} className="gap-2">
                            <UserPlus className="h-4 w-4"/>
                            {t('newPatient')}
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => router.push('/sales/records')}>
                        {t('salesRecords')}
                    </Button>
                </div>
            </div>

            {/* Tabs bar */}
            {tabs.length > 0 && (
                <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b-2 border-border">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTabId(tab.id)}
                            className={`group flex items-center gap-2 px-4 py-2 rounded-t-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                                activeTabId === tab.id
                                    ? 'bg-primary text-primary-foreground border-2 border-b-0 border-primary'
                                    : 'hover:bg-muted border-2 border-transparent border-b-0'
                            }`}
                        >
                            {tab.label}
                            <span
                                className="ml-1 cursor-pointer opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeTab(tab.id);
                                }}
                            >
                ×
              </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Active tab content */}
            <div className="flex-1 min-h-0 mt-2">
                {activeTabId && (
                    <PatientBasket
                        key={activeTabId}
                        tabId={activeTabId}
                        patientLabel={tabs.find(t => t.id === activeTabId)?.label || ''}
                        onRemoveTab={() => {
                            removeTab(activeTabId!);
                            refreshStats();   // update today's stats after tab closes
                        }}
                    />
                )}
                {tabs.length === 0 && user?.currentBranchId && (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                            <UserPlus className="mx-auto h-12 w-12 mb-4 opacity-50"/>
                            <p>{t('noActivePatient')}</p>
                            <Button className="mt-4" onClick={addTab}>
                                <UserPlus className="h-4 w-4 mr-2"/>
                                {t('newPatient')}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
