import {AppDataSource} from '../../core/config/database';
import {SaleTransaction, InsuranceProvider} from './entities/SaleTransaction';
import {DrugBatch} from '../inventory/entities/DrugBatch';
import {Drug} from '../inventory/entities/Drug';
import {AppError} from '../../core/errors/AppError';
import {StockMovement, MovementType} from '../inventory/entities/StockMovement';
import {ControlledDrugLog} from '../inventory/entities/ControlledDrugLog';
import {Settings} from '../settings/entities/Settings';
import {v4 as uuidv4} from 'uuid';
import {paginate} from '../../core/utils/pagination';
import {Branch} from '../branches/entities/Branch';
import {SettingsService} from '../settings/settings.service';

function dayBounds(startDate?: string, endDate?: string): {from?: Date; to?: Date} {
    const out: {from?: Date; to?: Date} = {};
    if (startDate) {
        const d = new Date(startDate);
        if (!Number.isNaN(d.getTime())) {
            d.setHours(0, 0, 0, 0);
            out.from = d;
        }
    }
    if (endDate) {
        const d = new Date(endDate);
        if (!Number.isNaN(d.getTime())) {
            d.setHours(23, 59, 59, 999);
            out.to = d;
        }
    }
    return out;
}

export type SalePaymentInput = {
    method: 'cash' | 'transfer' | 'pos' | 'credit';
    customerName?: string;
    customerFamily?: string;
    customerPhone?: string;
    posReference?: string;
    /** When set and not 'none', eligible lines get insurer share */
    insuranceProvider?: InsuranceProvider;
    insuranceMemberId?: string;
};

export class SalesService {
    private saleRepo = AppDataSource.getRepository(SaleTransaction);
    private batchRepo = AppDataSource.getRepository(DrugBatch);
    private movementRepo = AppDataSource.getRepository(StockMovement);
    private settingsService = new SettingsService();

    async recordBatchSale(
        items: {drugBatchId: string; quantity: number; prescriptionRef?: string}[],
        employeeId: string,
        branchId: string,
        payment: SalePaymentInput = {method: 'cash'}
    ) {
        if (!branchId) throw new AppError('No branch assigned', 400);
        if (!items?.length) throw new AppError('Sale must contain at least one item', 400);

        const insuranceProvider: InsuranceProvider =
            payment.insuranceProvider && payment.insuranceProvider !== 'none'
                ? payment.insuranceProvider
                : 'none';

        if (insuranceProvider !== 'none' && !payment.insuranceMemberId?.trim()) {
            throw new AppError('Insurance member ID is required when applying insurance', 400);
        }

        if (payment.method === 'pos' && !payment.posReference?.trim()) {
            throw new AppError('POS reference is required for card payments', 400);
        }

        const coveragePercent =
            insuranceProvider === 'none'
                ? 0
                : await this.settingsService.getDefaultInsuranceCoveragePercent();

        return AppDataSource.transaction(async (manager) => {
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
            let basketInsuranceCoverage = 0;
            let basketPatientShare = 0;

            for (const item of items) {
                if (item.quantity <= 0) {
                    throw new AppError('Quantity must be positive', 400);
                }

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

                const drug = await manager.findOne(Drug, {
                    where: {id: batch.drugId},
                    select: ['id', 'insuranceEligible', 'name', 'isControlled'],
                });

                await manager.decrement(DrugBatch, {id: item.drugBatchId}, 'count', item.quantity);

                const unitPrice = Math.round(Number(batch.sellingPrice ?? 0));
                const lineTotal = unitPrice * item.quantity;

                // Only formulary/eligible drugs share with insurer
                const eligible = Boolean(drug?.insuranceEligible) && insuranceProvider !== 'none';
                const insuranceCoverageAmount = eligible
                    ? Math.round((lineTotal * coveragePercent) / 100)
                    : 0;
                const patientShareAmount = lineTotal - insuranceCoverageAmount;

                basketInsuranceCoverage += insuranceCoverageAmount;
                basketPatientShare += patientShareAmount;

                const saleInsert = await manager.insert(SaleTransaction, {
                    drugBatchId: item.drugBatchId,
                    quantity: item.quantity,
                    unitPrice,
                    totalPrice: lineTotal,
                    employeeId,
                    branchId,
                    isOfferSale: batch.isOffer,
                    prescriptionRef: item.prescriptionRef ?? null,
                    basketId,
                    franchiseFee: 0,
                    paymentMethod: payment.method,
                    customerName: payment.customerName || null,
                    customerFamily: payment.customerFamily || null,
                    customerPhone: payment.customerPhone || null,
                    posReference: payment.posReference || null,
                    isPaid: payment.method !== 'credit',
                    insuranceProvider: eligible ? insuranceProvider : 'none',
                    insuranceMemberId: eligible ? payment.insuranceMemberId!.trim() : null,
                    insuranceCoverageAmount,
                    patientShareAmount,
                });

                const saleId = saleInsert.identifiers[0]?.id as string;

                await manager.insert(StockMovement, {
                    drugBatchId: item.drugBatchId,
                    type: MovementType.SALE,
                    quantity: item.quantity,
                    fromBranchId: branchId,
                    performedById: employeeId,
                    note: `Basket ${basketId}`,
                });

                if (drug?.isControlled) {
                    await manager.insert(ControlledDrugLog, {
                        drugId: drug.id,
                        branchId,
                        dispensedById: employeeId,
                        quantity: item.quantity,
                        patientName:
                            [payment.customerName, payment.customerFamily].filter(Boolean).join(' ') ||
                            null,
                        prescriptionRef: item.prescriptionRef ?? null,
                        saleId: saleId ?? null,
                        notes: `Auto-logged from sale basket ${basketId}`,
                    });
                }

                if (saleIndex === 0) {
                    firstSaleId = saleId;
                }
                saleIndex++;
            }

            if (firstSaleId && applyFranchise && franchiseAmount > 0) {
                const fee = Math.round(franchiseAmount);
                // Attach franchise to first line and increase patient share accordingly
                const first = await manager.findOne(SaleTransaction, {where: {id: firstSaleId}});
                if (first) {
                    first.franchiseFee = fee;
                    first.patientShareAmount = Number(first.patientShareAmount || 0) + fee;
                    await manager.save(first);
                }
                basketPatientShare += fee;
            }

            return {
                basketId,
                currency: 'IRR',
                insuranceProvider,
                insuranceCoverageAmount: basketInsuranceCoverage,
                patientShareAmount: basketPatientShare,
                coveragePercent: insuranceProvider === 'none' ? 0 : coveragePercent,
            };
        });
    }

    private applySaleFilters(
        query: ReturnType<typeof this.saleRepo.createQueryBuilder>,
        filters: {
            branchId?: string;
            employeeId?: string;
            startDate?: string;
            endDate?: string;
            paymentMethod?: string;
            search?: string;
        }
    ) {
        const {from, to} = dayBounds(filters.startDate, filters.endDate);

        if (filters.branchId) query.andWhere('sale.branchId = :branchId', {branchId: filters.branchId});
        if (filters.employeeId) query.andWhere('sale.employeeId = :employeeId', {employeeId: filters.employeeId});
        if (from) query.andWhere('sale.soldDate >= :from', {from});
        if (to) query.andWhere('sale.soldDate <= :to', {to});
        if (filters.paymentMethod) {
            query.andWhere('sale.paymentMethod = :paymentMethod', {paymentMethod: filters.paymentMethod});
        }
        if (filters.search) {
            query.andWhere(
                '(sale.customerName ILIKE :search OR sale.customerFamily ILIKE :search OR sale.customerPhone ILIKE :search)',
                {search: `%${filters.search}%`}
            );
        }
        return query;
    }

    async getSales(filters: any) {
        const query = this.saleRepo
            .createQueryBuilder('sale')
            .leftJoinAndSelect('sale.drugBatch', 'batch')
            .leftJoinAndSelect('batch.drug', 'drug')
            .leftJoinAndSelect('sale.employee', 'employee')
            .leftJoinAndSelect('sale.branch', 'branch');

        this.applySaleFilters(query, filters);
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

        this.applySaleFilters(query, filters);

        return paginate(query.orderBy('sale.soldDate', 'DESC'), {
            page: pagination.page || 1,
            limit: pagination.limit || 10,
        });
    }

    async getSalesSummary(filters: {
        branchId?: string;
        employeeId?: string;
        startDate?: string;
        endDate?: string;
    }) {
        const query = this.saleRepo
            .createQueryBuilder('sale')
            .select('COALESCE(SUM(sale.totalPrice), 0)', 'totalRevenue')
            .addSelect('COUNT(sale.id)', 'transactionCount');

        this.applySaleFilters(query, filters);

        const raw = await query.getRawOne<{totalRevenue: string; transactionCount: string}>();
        return {
            totalRevenue: Number(raw?.totalRevenue ?? 0),
            transactionCount: parseInt(String(raw?.transactionCount ?? '0'), 10) || 0,
            currency: 'IRR',
        };
    }

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
