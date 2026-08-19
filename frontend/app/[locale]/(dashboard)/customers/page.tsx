'use client';

import {useCallback, useEffect, useState} from 'react';
import {useApi} from '@/hooks/useAPI';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {Card} from '@/components/ui/Card';
import {Table, TBody, TD, TH, THead, TR} from '@/components/ui/Table';

type Customer = {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    nationalId?: string | null;
    allergies?: string | null;
    defaultInsuranceProvider?: string | null;
    defaultInsuranceMemberId?: string | null;
};

export default function CustomersPage() {
    const {get, post} = useApi();
    const [items, setItems] = useState<Customer[]>([]);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        nationalId: '',
        allergies: '',
        defaultInsuranceProvider: 'none',
        defaultInsuranceMemberId: '',
    });

    const load = useCallback(async () => {
        const data = await get<any>(`/customers?limit=50&search=${encodeURIComponent(search)}`);
        setItems(data?.items || data?.data || []);
    }, [get, search]);

    useEffect(() => {
        load();
    }, [load]);

    const create = async () => {
        await post('/customers', form);
        setForm({
            firstName: '',
            lastName: '',
            phone: '',
            nationalId: '',
            allergies: '',
            defaultInsuranceProvider: 'none',
            defaultInsuranceMemberId: '',
        });
        await load();
    };

    return (
        <div className="p-4 sm:p-6 space-y-4">
            <h1 className="page-title text-xl">Customers / Patients</h1>
            <Card className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input
                        placeholder="First name"
                        value={form.firstName}
                        onChange={(e) => setForm({...form, firstName: e.target.value})}
                    />
                    <Input
                        placeholder="Last name"
                        value={form.lastName}
                        onChange={(e) => setForm({...form, lastName: e.target.value})}
                    />
                    <Input
                        placeholder="Phone"
                        value={form.phone}
                        onChange={(e) => setForm({...form, phone: e.target.value})}
                    />
                    <Input
                        placeholder="National ID"
                        value={form.nationalId}
                        onChange={(e) => setForm({...form, nationalId: e.target.value})}
                    />
                    <Input
                        placeholder="Allergies"
                        value={form.allergies}
                        onChange={(e) => setForm({...form, allergies: e.target.value})}
                    />
                    <Input
                        placeholder="Insurance member ID"
                        value={form.defaultInsuranceMemberId}
                        onChange={(e) =>
                            setForm({...form, defaultInsuranceMemberId: e.target.value})
                        }
                    />
                </div>
                <Button onClick={create}>Add customer</Button>
            </Card>

            <div className="flex gap-2">
                <Input
                    placeholder="Search name / phone / national id"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Button variant="outline" onClick={load}>
                    Search
                </Button>
            </div>

            <Card className="overflow-x-auto">
                <Table>
                    <THead>
                        <TR>
                            <TH>Name</TH>
                            <TH>Phone</TH>
                            <TH>National ID</TH>
                            <TH>Allergies</TH>
                            <TH>Insurance</TH>
                        </TR>
                    </THead>
                    <TBody>
                        {items.map((c) => (
                            <TR key={c.id}>
                                <TD>
                                    {c.firstName} {c.lastName}
                                </TD>
                                <TD>{c.phone || '—'}</TD>
                                <TD>{c.nationalId || '—'}</TD>
                                <TD>{c.allergies || '—'}</TD>
                                <TD>
                                    {c.defaultInsuranceProvider || 'none'}{' '}
                                    {c.defaultInsuranceMemberId || ''}
                                </TD>
                            </TR>
                        ))}
                    </TBody>
                </Table>
            </Card>
        </div>
    );
}
