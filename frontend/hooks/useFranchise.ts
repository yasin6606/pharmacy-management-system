// hooks/useFranchise.ts
'use client';
import {useState, useEffect} from 'react';
import {apiGet} from '@/lib/api';

export function useFranchise() {
    const [amount, setAmount] = useState(0);

    useEffect(() => {
        apiGet<{ franchiseAmount: number }>('/settings/franchise')
            .then(data => {
                if (data) setAmount(data.franchiseAmount);
            })
            .catch(() => {
            });
    }, []);

    return amount;
}
