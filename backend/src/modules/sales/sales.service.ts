import {AppDataSource} from '../../core/config/database';
import {SaleTransaction} from './entities/SaleTransaction';
import {DrugBatch} from '../inventory/entities/DrugBatch';
import {AppError} from '../../core/errors/AppError';
import {StockMovement, MovementType} from '../inventory/entities/StockMovement';
import {Settings} from '../settings/entities/Settings';
import {v4 as uuidv4} from 'uuid';
import {paginate} from '../../core/utils/pagination';
import {Branch} from '../branches/entities/Branch';

/**
 * Sales domain service.
 *
 * `recordBatchSale` is the critical path: it decrements stock and writes
 * sale + movement rows inside a single DB transaction with pessimistic locks
 * to prevent overselling under concurrent cashiers.
 */
export class SalesService {
    private saleRepo = AppDataSource.getRepository(SaleTransaction);
    private batchRepo = AppDataSource.getRepository(DrugBatch);
    private movementRepo = AppDataSource.getRepository(StockMovement);

    /**
     * Record a multi-item basket sale.
     *
     * @param items - line items (batch + qty)
     * @param employeeId - cashier performing the sale
     * @param branchId - branch where stock is taken from
     * @param payment - payment method + optional customer / POS metadata
     */
    async recordBatchSale(
        items: {drugBatchId: string; quantity: number; prescriptionRef?: string}[],
        employeeId: string,
        branchId: string,
        payment: {
            method: 'cash' | 'transfer' | 'pos' | 'credit';
            customerName?: string;
            customerFamily?: string;
            customerPhone?: string;
            posReference?: string;
        } = {method: 'cash'}
    ) {
        if (!branchId) throw new AppError('No branch assigned', 400);
        if (!items?.length) throw new AppError('Sale must contain at least one item', 400);

        return AppDataSource.transaction(async (manager) => {
            // Franchise fee is applied once per basket when the branch opts in
            const franchiseSetting = await manager.findOne(Settings, {
                where: {key: 'franchise_amount'},
            });
            const franchiseAmount = franchiseSetting ? Number(franchiseSetting.value) : 0;

            const branch = await manager.findOne(Branch, {
                where: {id: branchId},
                select: ['hasFranchise'],
            });
            const applyFranchise = branch?.hasFranchise ?? false;

            const basketId = uuidv4();
            let firstSaleId: string | null = null;
            let saleIndex = 0;

            for (const item of items) {
                if (item.quantity <= 0) {
                    throw new AppError('Quantity must be positive', 400);
                }

                // Lock the batch row so concurrent sales cannot oversell
                const batch = await manager.findOne(DrugBatch, {
                    where: {id: item.drugBatchId},
                    select: ['id', 'count', 'branchId', 'drugId', 'sellingPrice', 'isOffer'],
                    lock: {mode: 'pessimistic_write'},
                });

                if (!batch) throw new AppError(`Batch ${item.drugBatchId} not found`, 404);
                if (batch.count < item.quantity) {
                    throw new AppError(
                        `Insufficient stock for batch ${item.drugBatchId}. Requested: ${item.quantity}, available: ${batch.count}`,
                        400
                    );
                }
                if (batch.branchId !== branchId) {
                    throw new AppError(`Batch ${item.drugBatchId} does not belong to your branch`, 400);
                }

                await manager.decrement(DrugBatch, {id: item.drugBatchId}, 'count', item.quantity);

                const unitPrice = Number(batch.sellingPrice ?? 0);
                const saleInsert = await manager.insert(SaleTransaction, {
                    drugBatchId: item.drugBatchId,
                    quantity: item.quantity,
                    unitPrice,
                    totalPrice: unitPrice * item.quantity,
                    employeeId,
                    branchId,
                    isOfferSale: batch.isOffer,
                    prescriptionRef: item.prescriptionRef,
                    basketId,
                    franchiseFee: 0, // may be set on the first line below
                    paymentMethod: payment.method,
                    customerName: payment.customerName || undefined,
                    customerFamily: payment.customerFamily || undefined,
                    customerPhone: payment.customerPhone || undefined,
                    posReference: payment.posReference || undefined,
                    // Credit sales start unpaid; cash/transfer/pos are considered paid
                    isPaid: payment.method !== 'credit',
                });

                await manager.insert(StockMovement, {
                    drugBatchId: item.drugBatchId,
                    type: MovementType.SALE,
                    quantity: item.quantity,
                    fromBranchId: branchId,
                    performedById: employeeId,
                    note: `Basket ${basketId}`,
                });

                if (saleIndex === 0) {
                    firstSaleId = saleInsert.identifiers[0].id as string;
                }
                saleIndex++;
            }

            // Attach franchise fee to the first line item only (one fee per basket)
            if (firstSaleId && applyFranchise && franchiseAmount > 0) {
                await manager.update(SaleTransaction, {id: firstSaleId}, {franchiseFee: franchiseAmount});
            }

            return true;
        });
    }

    async getSales(filters: any) {
        const query = this.saleRepo
            .createQueryBuilder('sale')
            .leftJoinAndSelect('sale.drugBatch', 'batch')
            .leftJoinAndSelect('batch.drug', 'drug')
            .leftJoinAndSelect('sale.employee', 'employee')
            .leftJoinAndSelect('sale.branch', 'branch');

        if (filters.branchId) query.andWhere('sale.branchId = :branchId', {branchId: filters.branchId});
        if (filters.employeeId) query.andWhere('sale.employeeId = :employeeId', {employeeId: filters.employeeId});
        if (filters.startDate) query.andWhere('sale.soldDate >= :startDate', {startDate: filters.startDate});
        if (filters.endDate) query.andWhere('sale.soldDate <= :endDate', {endDate: filters.endDate});

        return query.orderBy('sale.soldDate', 'DESC').getMany();
    }

    async getSalesPaginated(
        filters: {
            branchId?: string;
            employeeId?: string;
            startDate?: string;
            endDate?: string;
            paymentMethod?: string;
            search?: string;
        },
        pagination: {page?: number; limit?: number}
    ) {
        const query = this.saleRepo
            .createQueryBuilder('sale')
            .leftJoinAndSelect('sale.drugBatch', 'batch')
            .leftJoinAndSelect('batch.drug', 'drug')
            .leftJoinAndSelect('sale.employee', 'employee')
            .leftJoinAndSelect('sale.branch', 'branch');

        if (filters.branchId) query.andWhere('sale.branchId = :branchId', {branchId: filters.branchId});
        if (filters.employeeId) query.andWhere('sale.employeeId = :employeeId', {employeeId: filters.employeeId});
        if (filters.startDate) query.andWhere('sale.soldDate >= :startDate', {startDate: filters.startDate});
        if (filters.endDate) query.andWhere('sale.soldDate <= :endDate', {endDate: filters.endDate});
        if (filters.paymentMethod) {
            query.andWhere('sale.paymentMethod = :paymentMethod', {paymentMethod: filters.paymentMethod});
        }
        if (filters.search) {
            query.andWhere(
                '(sale.customerName ILIKE :search OR sale.customerFamily ILIKE :search OR sale.customerPhone ILIKE :search)',
                {search: `%${filters.search}%`}
            );
        }

        return paginate(query.orderBy('sale.soldDate', 'DESC'), {
            page: pagination.page || 1,
            limit: pagination.limit || 10,
        });
    }

    /** Mark all credit lines in a basket as paid (same branch only). */
    async markBasketAsPaid(basketId: string, branchId: string) {
        return AppDataSource.transaction(async (manager) => {
            const result = await manager.update(
                SaleTransaction,
                {basketId, branchId},
                {isPaid: true}
            );
            if (result.affected === 0) {
                throw new AppError('No matching credit sales found', 404);
            }
            return true;
        });
    }
}
