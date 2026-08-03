'use client';
import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {useApi} from '@/hooks/useAPI';
import {useRole} from '@/hooks/useRole';
import {PaginatedResponse, PaginationParams, User} from '@/types';
import {Button} from '@/components/ui/Button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/Card';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/Table';
import {Modal} from '@/components/ui/Modal';
import {EmployeeForm} from '@/components/forms/EmployeeForm';
import {Plus, Pencil, Trash2, Loader2} from 'lucide-react';
import {Pagination} from "@/components/ui/Pagination";

export default function EmployeesPage() {
    const t = useTranslations('employees');
    const commonT = useTranslations('common');
    const {canManageEmployees} = useRole();
    const {get, del} = useApi();

    const [employees, setEmployees] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const limit: number = 10;

    // Modal states
    const [showForm, setShowForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
    const [deletingEmployee, setDeletingEmployee] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchEmployees = async (currentPage: number = 1) => {
        setLoading(true);

        const params: PaginationParams = {page: currentPage, limit};
        const data = await get<PaginatedResponse<User>>('/employees', {params});

        if (data) {
            setEmployees(data.items);
            setPage(data.page);
            setTotalPages(data.totalPages);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleDelete = async () => {
        if (!deletingEmployee) return;
        setIsDeleting(true);

        // Attempt deletion
        const result = await del(`/employees/${deletingEmployee.id}`);

        setIsDeleting(false);

        if (result !== undefined) {
            // Success – the backend returned a response without error
            setDeletingEmployee(null);
            fetchEmployees();
        }
        // If result === undefined, an error occurred and a toast was already shown.
    };

    if (!canManageEmployees) {
        return (
            <div className="flex items-center justify-center h-64">
                <Card className="p-6 text-center">
                    <p className="text-muted-foreground">{commonT('unauthorized')}</p>
                </Card>
            </div>
        );
    }

    if (loading) {
        return <div className="flex justify-center py-12">{commonT('loading')}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('title')}</h1>
                <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2"/>
                    {t('addEmployee')}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('allEmployees')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {employees.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">{t('noEmployees')}</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('fullName')}</TableHead>
                                        <TableHead>{t('email')}</TableHead>
                                        <TableHead>{t('role')}</TableHead>
                                        <TableHead>{t('branch')}</TableHead>
                                        <TableHead className="w-[100px]">{commonT('actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employees.map(emp => (
                                        <TableRow key={emp.id}>
                                            <TableCell className="font-medium">{emp.fullName}</TableCell>
                                            <TableCell>{emp.email}</TableCell>
                                            <TableCell className="capitalize">{t(`roles.${emp.role}`)}</TableCell>
                                            <TableCell>{emp.currentBranch?.name || '—'}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setEditingEmployee(emp)}
                                                        aria-label={commonT('edit')}
                                                    >
                                                        <Pencil className="h-4 w-4"/>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeletingEmployee(emp)}
                                                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                                                        aria-label={commonT('delete')}
                                                    >
                                                        <Trash2 className="h-4 w-4"/>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Pagination
                                page={page}
                                totalPages={totalPages}
                                onPageChange={(newPage) => fetchEmployees(newPage)}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Employee Modal */}
            <Modal open={showForm} onClose={() => setShowForm(false)} title={t('addEmployee')}>
                <EmployeeForm
                    onSuccess={() => {
                        setShowForm(false);
                        fetchEmployees();
                    }}
                    onCancel={() => setShowForm(false)}
                />
            </Modal>

            {/* Edit Employee Modal */}
            <Modal open={!!editingEmployee} onClose={() => setEditingEmployee(null)} title={t('editEmployee')}>
                {editingEmployee && (
                    <EmployeeForm
                        employee={editingEmployee}
                        onSuccess={() => {
                            setEditingEmployee(null);
                            fetchEmployees();
                        }}
                        onCancel={() => setEditingEmployee(null)}
                    />
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal open={!!deletingEmployee} onClose={() => !isDeleting && setDeletingEmployee(null)}
                   title={t('deleteTitle')}>
                <p className="text-muted-foreground mb-6">
                    {t('deleteConfirm', {name: deletingEmployee?.fullName})}
                </p>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDeletingEmployee(null)} disabled={isDeleting}>
                        {commonT('cancel')}
                    </Button>
                    <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin"/>
                        ) : (
                            commonT('delete')
                        )}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
