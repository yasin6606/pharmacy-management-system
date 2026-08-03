// context/SalesTabsContext.tsx
'use client';
import {createContext, useContext, useState, ReactNode, useCallback} from 'react';
import {DrugBatch} from '@/types';

export interface PatientTab {
    id: number;
    label: string;
}

export interface BasketItem {
    batch: DrugBatch;
    quantity: number;
    prescriptionRef?: string;
}

interface SalesTabsContextType {
    tabs: PatientTab[];
    activeTabId: number | null;
    addTab: () => void;
    removeTab: (id: number) => void;
    setActiveTabId: (id: number | null) => void;
    clearAllTabs: () => void;
    getBasket: (tabId: number) => BasketItem[];
    updateBasket: (tabId: number, items: BasketItem[]) => void;
    clearBasket: (tabId: number) => void;
}

const SalesTabsContext = createContext<SalesTabsContextType | undefined>(undefined);

let globalTabId = 0;

export function SalesTabsProvider({children}: { children: ReactNode }) {
    const [tabs, setTabs] = useState<PatientTab[]>([]);
    const [activeTabId, setActiveTabId] = useState<number | null>(null);
    const [baskets, setBaskets] = useState<Record<number, BasketItem[]>>({});

    const addTab = useCallback(() => {
        const newId = ++globalTabId;
        setTabs(prev => [...prev, {id: newId, label: `Patient ${newId}`}]);
        setActiveTabId(newId);
        // Initialize empty basket
        setBaskets(prev => ({...prev, [newId]: []}));
    }, []);

    const removeTab = useCallback((id: number) => {
        setTabs(prev => prev.filter(t => t.id !== id));
        setBaskets(prev => {
            const {[id]: _, ...rest} = prev;
            return rest;
        });
        if (activeTabId === id) {
            const remaining = tabs.filter(t => t.id !== id);
            setActiveTabId(remaining.length > 0 ? remaining[0].id : null);
        }
    }, [activeTabId, tabs]);

    const clearAllTabs = useCallback(() => {
        setTabs([]);
        setActiveTabId(null);
        setBaskets({});
    }, []);

    const getBasket = useCallback((tabId: number) => baskets[tabId] || [], [baskets]);
    const updateBasket = useCallback((tabId: number, items: BasketItem[]) => {
        setBaskets(prev => ({...prev, [tabId]: items}));
    }, []);
    const clearBasket = useCallback((tabId: number) => {
        updateBasket(tabId, []);
    }, [updateBasket]);

    return (
        <SalesTabsContext.Provider value={{
            tabs, activeTabId, addTab, removeTab, setActiveTabId, clearAllTabs,
            getBasket, updateBasket, clearBasket
        }}>
            {children}
        </SalesTabsContext.Provider>
    );
}

export function useSalesTabs() {
    const ctx = useContext(SalesTabsContext);
    if (!ctx) throw new Error('useSalesTabs must be used within SalesTabsProvider');
    return ctx;
}
