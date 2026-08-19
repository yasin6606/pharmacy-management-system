'use client';

import {useCallback, useEffect, useState} from 'react';
import {useApi} from '@/hooks/useAPI';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {Card} from '@/components/ui/Card';
import {formatIRR} from '@/lib/currency';

export default function OperationsPage() {
    const {get, post} = useApi();
    const [shift, setShift] = useState<any>(null);
    const [alerts, setAlerts] = useState<any>(null);
    const [reorder, setReorder] = useState<any[]>([]);
    const [barcode, setBarcode] = useState('');
    const [barcodeResult, setBarcodeResult] = useState<any>(null);
    const [closingCash, setClosingCash] = useState('');
    const [openingFloat, setOpeningFloat] = useState('0');
    const [audit, setAudit] = useState<any[]>([]);
    const [backup, setBackup] = useState<any>(null);

    const refresh = useCallback(async () => {
        const s = await get<any>('/ops/shifts/current');
        setShift(s);
        const a = await get<any>('/ops/alerts/stock?days=30');
        setAlerts(a);
        const r = await get<any>('/ops/reorder-suggestions');
        setReorder(Array.isArray(r) ? r : r?.items || []);
        const ad = await get<any>('/ops/audit?limit=20');
        setAudit(ad?.items || []);
    }, [get]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const openShift = async () => {
        await post('/ops/shifts/open', {openingFloat: Number(openingFloat) || 0});
        await refresh();
    };

    const closeShift = async () => {
        if (!shift?.id) return;
        await post(`/ops/shifts/${shift.id}/close`, {
            closingCashCounted: Number(closingCash) || 0,
        });
        await refresh();
    };

    const lookupBarcode = async () => {
        const data = await get<any>(`/ops/barcode/${encodeURIComponent(barcode)}`);
        setBarcodeResult(data);
    };

    const loadBackup = async () => {
        const data = await get<any>('/ops/backup-info');
        setBackup(data);
    };

    return (
        <div className="p-4 sm:p-6 space-y-4">
            <h1 className="page-title text-xl">Operations</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-4 space-y-3">
                    <h2 className="font-semibold">Cash shift</h2>
                    {shift ? (
                        <div className="text-sm space-y-1">
                            <p>Status: <b>{shift.status}</b></p>
                            <p>Opened: {new Date(shift.openedAt).toLocaleString()}</p>
                            <p>Opening float: {formatIRR(shift.openingFloat)}</p>
                            <Input
                                placeholder="Closing cash counted (IRR)"
                                value={closingCash}
                                onChange={(e) => setClosingCash(e.target.value)}
                            />
                            <Button onClick={closeShift}>Close shift</Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Input
                                placeholder="Opening float (IRR)"
                                value={openingFloat}
                                onChange={(e) => setOpeningFloat(e.target.value)}
                            />
                            <Button onClick={openShift}>Open shift</Button>
                        </div>
                    )}
                </Card>

                <Card className="p-4 space-y-3">
                    <h2 className="font-semibold">Barcode lookup</h2>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Scan or type barcode"
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                        />
                        <Button onClick={lookupBarcode}>Lookup</Button>
                    </div>
                    {barcodeResult && (
                        <pre className="text-xs overflow-auto max-h-40 bg-black/5 dark:bg-white/5 p-2 rounded">
                            {JSON.stringify(barcodeResult, null, 2)}
                        </pre>
                    )}
                </Card>

                <Card className="p-4 space-y-2">
                    <h2 className="font-semibold">Stock alerts</h2>
                    <p className="text-xs text-muted-foreground">
                        Low stock: {alerts?.lowStock?.length ?? 0} · Near expiry:{' '}
                        {alerts?.nearExpiry?.length ?? 0}
                    </p>
                    <ul className="text-sm max-h-40 overflow-auto space-y-1">
                        {(alerts?.lowStock || []).slice(0, 8).map((x: any) => (
                            <li key={x.batchId}>
                                {x.drugName}: {x.count} (min {x.minStockLevel})
                            </li>
                        ))}
                    </ul>
                </Card>

                <Card className="p-4 space-y-2">
                    <h2 className="font-semibold">Reorder suggestions</h2>
                    <ul className="text-sm max-h-40 overflow-auto space-y-1">
                        {reorder.slice(0, 10).map((x: any) => (
                            <li key={x.drugId}>
                                {x.name}: on hand {x.onHand}, order ~{x.suggestedOrderQty}
                            </li>
                        ))}
                        {reorder.length === 0 && <li>No suggestions</li>}
                    </ul>
                </Card>

                <Card className="p-4 space-y-2 lg:col-span-2">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Audit log (recent)</h2>
                        <Button variant="outline" size="sm" onClick={loadBackup}>
                            Backup info
                        </Button>
                    </div>
                    <ul className="text-xs max-h-48 overflow-auto space-y-1 font-mono">
                        {audit.map((a: any) => (
                            <li key={a.id}>
                                {a.createdAt} · {a.action} · {a.entityType}/{a.entityId}
                            </li>
                        ))}
                    </ul>
                    {backup && (
                        <pre className="text-xs bg-black/5 dark:bg-white/5 p-2 rounded overflow-auto">
                            {JSON.stringify(backup, null, 2)}
                        </pre>
                    )}
                </Card>
            </div>
        </div>
    );
}
