'use client';
import {useState, useEffect, useMemo} from 'react';
import {useTranslations} from 'next-intl';
import {useApi} from '@/hooks/useAPI';
import {useRole} from '@/hooks/useRole';
import {Sale, Branch, PaginatedResponse} from '@/types';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/Card';
import {Select} from '@/components/ui/Select';
import {Input} from '@/components/ui/Input';
import {Pagination} from '@/components/ui/Pagination';
import {Badge} from '@/components/ui/Badge';
import {Button} from '@/components/ui/Button';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/Table';
import {Filter, CreditCard, ChevronDown, ChevronRight, User, Phone, Calendar, Search, CheckCircle} from 'lucide-react';

type BasketGroup = {
    basketId: string;
    customerName: string;
    customerFamily: string;
    customerPhone: string;
    date: string;
    items: Sale[];
    total: number;
    isPaid: boolean;
};

export default function CreditsPage() {
    const t = useTranslations('credits');
    const c = useTranslations('common');
    const b = useTranslations('branches');
    const {isManager, isAccountant} = useRole();
    const {get, patch} = useApi();

    const [allCredits, setAllCredits] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [branchId, setBranchId] = useState('');
    const [expandedBaskets, setExpandedBaskets] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [markingPaid, setMarkingPaid] = useState<string | null>(null); // basketId being paid

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    useEffect(() => {
        if (isManager || isAccountant) {
            get<PaginatedResponse<Branch>>('/branches', {params: {limit: 100}})
                .then(d => d && setBranches(d.items));
        }
    }, [get, isManager, isAccountant]);

    const fetchCredits = async () => {
        setLoading(true);
        const params: any = {page: 1, limit: 200, paymentMethod: 'credit'}; // fetch all to group
        if (branchId) params.branchId = branchId;
        const data = await get<PaginatedResponse<Sale>>('/sales', {params});
        if (data) {
            setAllCredits(data.items);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCredits();
    }, [branchId]);

    // Group by basketId, and determine if all items are paid
    const groupMap = new Map<string, BasketGroup>();
    for (const sale of allCredits) {
        const basketId = sale.basketId || sale.id;
        if (!groupMap.has(basketId)) {
            groupMap.set(basketId, {
                basketId,
                customerName: sale.customerName || '',
                customerFamily: sale.customerFamily || '',
                customerPhone: sale.customerPhone || '',
                date: sale.soldDate,
                items: [],
                total: 0,
                isPaid: true, // assume paid until proven otherwise
            });
        }
        const group = groupMap.get(basketId)!;
        group.items.push(sale);
        group.total += Number(sale.totalPrice);
        if (sale.soldDate < group.date) group.date = sale.soldDate;
        // If any sale in the basket is unpaid, mark the basket as unpaid
        if (!sale.isPaid) group.isPaid = false;
    }
    let allGroups = Array.from(groupMap.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Local filtering based on search query
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        allGroups = allGroups.filter(
            g =>
                g.customerName?.toLowerCase().includes(q) ||
                g.customerFamily?.toLowerCase().includes(q) ||
                g.customerPhone?.includes(searchQuery.trim())
        );
    }

    // Manual pagination of groups
    const totalItems = allGroups.length;
    const totalPagesCalc = Math.ceil(totalItems / limit);
    const paginatedGroups = allGroups.slice((page - 1) * limit, page * limit);

    // Sync totalPages state
    if (totalPagesCalc !== totalPages) setTotalPages(totalPagesCalc);

    const toggleExpand = (basketId: string) => {
        const newExpanded = new Set(expandedBaskets);
        if (newExpanded.has(basketId)) newExpanded.delete(basketId);
        else newExpanded.add(basketId);
        setExpandedBaskets(newExpanded);
    };

    const markAsPaid = async (basketId: string) => {
        setMarkingPaid(basketId);
        try {
            await patch(`/sales/basket/${basketId}/pay`, {});
            // Refresh data
            fetchCredits();
        } catch (error) {
            // Error toast handled globally
        } finally {
            setMarkingPaid(null);
        }
    };

    const branchOptions = [
        {value: '', label: b('allBranches') || 'All Branches'},
        ...branches.map(b => ({value: b.id, label: b.name})),
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('title')}</h1>

            {/* Filters row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {(isManager || isAccountant) && (
                    <div className="flex items-center gap-4">
                        <Filter className="h-4 w-4 text-muted-foreground"/>
                        <Select
                            label=""
                            options={branchOptions}
                            value={branchId}
                            onChange={e => {
                                setBranchId(e.target.value);
                                setPage(1);
                            }}
                            className="w-48 text-sm"
                        />
                    </div>
                )}
                {/* Search input */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                    <Input
                        placeholder={t('searchPlaceholder')}
                        value={searchQuery}
                        onChange={e => {
                            setSearchQuery(e.target.value);
                            setPage(1);
                        }}
                        className="pl-8 text-xs sm:text-sm"
                    />
                </div>
            </div>

            <Card>
                <CardHeader><CardTitle>{t('allCredits')}</CardTitle></CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12">{c('loading')}</div>
                    ) : paginatedGroups.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <CreditCard className="mx-auto h-12 w-12 mb-4 opacity-50"/>
                            <p>{t('noCredits')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                {paginatedGroups.map(group => (
                                    <Card key={group.basketId} className="border-2">
                                        <button
                                            className="w-full p-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                                            onClick={() => toggleExpand(group.basketId)}
                                        >
                                            <div
                                                className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                                                <div className="flex items-center gap-1">
                                                    <User className="h-4 w-4 text-muted-foreground"/>
                                                    <span className="font-medium">
                            {group.customerName || group.customerFamily
                                ? `${group.customerName} ${group.customerFamily}`.trim()
                                : t('unknownCustomer')}
                          </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Phone className="h-4 w-4 text-muted-foreground"/>
                                                    <span>{group.customerPhone || '—'}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4 text-muted-foreground"/>
                                                    <span>{new Date(group.date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 ml-4">
                                                {group.isPaid && (
                                                    <CheckCircle className="h-4 w-4 text-green-500"/>
                                                )}
                                                <Badge variant={group.isPaid ? 'success' : 'danger'}
                                                       className="text-xs">
                                                    {group.isPaid ? t('paid') : `$${group.total.toFixed(2)}`}
                                                </Badge>
                                                {expandedBaskets.has(group.basketId) ? (
                                                    <ChevronDown className="h-5 w-5"/>
                                                ) : (
                                                    <ChevronRight className="h-5 w-5"/>
                                                )}
                                            </div>
                                        </button>

                                        {/* Expanded drug list */}
                                        {expandedBaskets.has(group.basketId) && (
                                            <div className="border-t p-4 space-y-3">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>{t('drug')}</TableHead>
                                                            <TableHead>{t('quantity')}</TableHead>
                                                            <TableHead>{t('unitPrice')}</TableHead>
                                                            <TableHead>{t('total')}</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {group.items.map(s => (
                                                            <TableRow key={s.id}>
                                                                <TableCell className="font-medium text-xs sm:text-sm">
                                                                    {s.drugBatch?.drug?.name || '—'}
                                                                </TableCell>
                                                                <TableCell
                                                                    className="text-xs sm:text-sm">{s.quantity}</TableCell>
                                                                <TableCell
                                                                    className="text-xs sm:text-sm">${s.unitPrice}</TableCell>
                                                                <TableCell className="font-semibold text-xs sm:text-sm">
                                                                    ${Number(s.totalPrice).toFixed(2)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                                {/* Mark as Paid button */}
                                                {!group.isPaid && (
                                                    <div className="flex justify-end">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => markAsPaid(group.basketId)}
                                                            disabled={markingPaid === group.basketId}
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-2"/>
                                                            {markingPaid === group.basketId ? c('saving') : t('markAsPaid')}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>

                            <div className="mt-4">
                                <Pagination page={page} totalPages={totalPages} onPageChange={p => setPage(p)}/>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
