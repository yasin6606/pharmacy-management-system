import {AppDataSource} from '../../core/config/database';
import {LossReport, LossReportStatus} from './entities/LossReport';
import {AppError} from '../../core/errors/AppError';
import {DrugBatch} from '../inventory/entities/DrugBatch';
import {StockMovement, MovementType} from '../inventory/entities/StockMovement';
import {paginate} from "../../core/utils/pagination";

export class LossReportsService {
    private reportRepo = AppDataSource.getRepository(LossReport);
    private batchRepo = AppDataSource.getRepository(DrugBatch);
    private movementRepo = AppDataSource.getRepository(StockMovement);

    async create(data: Partial<LossReport>) {
        const report = this.reportRepo.create(data);
        return this.reportRepo.save(report);
    }

    async review(reportId: string, status: LossReportStatus, reviewedById: string) {
        return AppDataSource.transaction(async (manager) => {
            const report = await manager.findOne(LossReport, {
                where: {id: reportId},
                relations: ['drug'],
            });
            if (!report) throw new AppError('Report not found', 404);
            if (report.status !== LossReportStatus.PENDING) {
                throw new AppError('Report already reviewed', 400);
            }

            if (status === LossReportStatus.APPROVED) {
                // Find appropriate batch (FIFO)
                const batch = await manager.findOne(DrugBatch, {
                    where: {drugId: report.drugId, branchId: report.branchId},
                    order: {expirationDate: 'ASC'},
                });

                if (!batch) {
                    throw new AppError('No stock found for this drug in the branch', 400);
                }
                if (batch.count < report.quantity) {
                    throw new AppError(
                        `Insufficient stock. Requested: ${report.quantity}, available: ${batch.count}`,
                        400
                    );
                }

                batch.count -= report.quantity;
                await manager.save(batch);

                await manager.save(StockMovement, {
                    drugBatchId: batch.id,
                    type: MovementType.ADJUSTMENT,
                    quantity: -report.quantity,
                    fromBranchId: report.branchId,
                    performedById: reviewedById,
                    note: `Loss report ${report.id} approved`,
                });
            }

            report.status = status;
            report.reviewedById = reviewedById;
            report.reviewedAt = new Date();
            return manager.save(report);
        });
    }

    // src/modules/loss-reports/loss-reports.service.ts

    async findAllPaginated(
        filters?: { branchId?: string; status?: LossReportStatus },
        pagination?: { page?: number; limit?: number }
    ) {
        const query = this.reportRepo.createQueryBuilder('report')
            .leftJoinAndSelect('report.reportedBy', 'reporter')
            .leftJoinAndSelect('report.drug', 'drug')
            .leftJoinAndSelect('report.branch', 'branch')
            .leftJoinAndSelect('report.reviewedBy', 'reviewer');

        if (filters?.branchId) query.andWhere('report.branchId = :branchId', {branchId: filters.branchId});
        if (filters?.status) query.andWhere('report.status = :status', {status: filters.status});

        const paginatedResult = await paginate(query.orderBy('report.createdAt', 'DESC'), pagination);

        // For each report, fetch the available stock (first matching batch)
        const itemsWithStock = await Promise.all(
            paginatedResult.items.map(async (report) => {
                const batch = await this.batchRepo.findOne({
                    where: {drugId: report.drugId, branchId: report.branchId},
                    order: {expirationDate: 'ASC'},
                    select: ['count'],
                });
                return {
                    ...report,
                    availableStock: batch ? batch.count : 0,
                };
            })
        );

        return {...paginatedResult, items: itemsWithStock};
    }

}
