import {AppDataSource} from '../../core/config/database';
import {Drug} from './entities/Drug';
import {DrugBatch} from './entities/DrugBatch';
import {StockMovement, MovementType} from './entities/StockMovement';
import {AppError} from '../../core/errors/AppError';
import {LessThanOrEqual, MoreThan} from 'typeorm';

export class InventoryService {
    private drugRepo = AppDataSource.getRepository(Drug);
    private batchRepo = AppDataSource.getRepository(DrugBatch);
    private movementRepo = AppDataSource.getRepository(StockMovement);

    // Drugs
    async createDrug(data: Partial<Drug>) {
        const drug = this.drugRepo.create(data);
        return this.drugRepo.save(drug);
    }

    async getAllDrugs() {
        return this.drugRepo.find({relations: ['batches']});
    }

    async getDrugById(id: string) {
        const drug = await this.drugRepo.findOne({
            where: {id},
            relations: ['batches', 'batches.branch'],
        });
        if (!drug) throw new AppError('Drug not found', 404);
        return drug;
    }

    async updateDrug(id: string, data: Partial<Drug>) {
        const drug = await this.drugRepo.findOne({where: {id}});
        if (!drug) throw new AppError('Drug not found', 404);
        Object.assign(drug, data);
        return this.drugRepo.save(drug);
    }

    // Batches
    async addBatch(data: Partial<DrugBatch>) {
        if (!data.drugId || !data.branchId) {
            throw new AppError('drugId and branchId are required', 400);
        }
        if (data.count !== undefined && data.count < 0) {
            throw new AppError('Batch count cannot be negative', 400);
        }
        const batch = this.batchRepo.create(data);
        return this.batchRepo.save(batch);
    }

    async getBatchesByBranch(branchId: string) {
        return this.batchRepo.find({where: {branchId}, relations: ['drug']});
    }

    async transferStock(
        batchId: string,
        toBranchId: string,
        quantity: number,
        performedById: string
    ) {
        if (quantity <= 0) throw new AppError('Quantity must be positive', 400);

        return AppDataSource.transaction(async (manager) => {
            const batch = await manager.findOne(DrugBatch, {
                where: {id: batchId},
                lock: {mode: 'pessimistic_write'},
            });
            if (!batch) throw new AppError('Batch not found', 404);
            if (batch.branchId === toBranchId) {
                throw new AppError('Cannot transfer to the same branch', 400);
            }
            if (batch.count < quantity) throw new AppError('Insufficient stock', 400);

            batch.count -= quantity;
            await manager.save(batch);

            let destBatch = await manager.findOne(DrugBatch, {
                where: {
                    drugId: batch.drugId,
                    branchId: toBranchId,
                    expirationDate: batch.expirationDate,
                },
                lock: {mode: 'pessimistic_write'},
            });

            if (destBatch) {
                destBatch.count += quantity;
            } else {
                destBatch = manager.create(DrugBatch, {
                    drugId: batch.drugId,
                    branchId: toBranchId,
                    expirationDate: batch.expirationDate,
                    count: quantity,
                    isOffer: batch.isOffer,
                    purchasePrice: batch.purchasePrice,
                    sellingPrice: batch.sellingPrice,
                });
            }
            await manager.save(destBatch);

            await manager.save(StockMovement, {
                drugBatchId: batch.id,
                type: MovementType.TRANSFER,
                quantity,
                fromBranchId: batch.branchId,
                toBranchId,
                performedById,
            });

            return destBatch;
        });
    }

    /**
     * Returns batches that expire within the next `daysThreshold` days
     * and still have stock remaining.
     */
    async getExpiringBatches(daysThreshold: number = 30) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thresholdDate = new Date(today);
        thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

        return this.batchRepo
            .createQueryBuilder('batch')
            .leftJoinAndSelect('batch.drug', 'drug')
            .leftJoinAndSelect('batch.branch', 'branch')
            .where('batch.expirationDate <= :thresholdDate', {thresholdDate})
            .andWhere('batch.expirationDate >= :today', {today})
            .andWhere('batch.count > 0')
            .orderBy('batch.expirationDate', 'ASC')
            .getMany();
    }

    async getDrugsPaginated(pagination: {page?: number; limit?: number}) {
        const page = Math.max(1, pagination.page || 1);
        const limit = Math.min(100, Math.max(1, pagination.limit || 10));
        const skip = (page - 1) * limit;

        const baseQuery = this.drugRepo
            .createQueryBuilder('drug')
            .leftJoin('drug.batches', 'batch')
            .groupBy('drug.id')
            .select('drug')
            .addSelect('COALESCE(SUM(batch.count), 0)', 'totalStock')
            .orderBy('drug.enteringDate', 'DESC');

        const totalResult = await this.drugRepo
            .createQueryBuilder('drug')
            .select('COUNT(DISTINCT drug.id)', 'count')
            .getRawOne();
        const total = parseInt((totalResult as any)?.count ?? '0', 10) || 0;

        const {entities, raw} = await baseQuery.skip(skip).take(limit).getRawAndEntities();

        const items = entities.map((entity, index) => ({
            ...entity,
            totalStock: raw[index] ? parseInt(raw[index].totalStock, 10) : 0,
        }));

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 0,
        };
    }
}
