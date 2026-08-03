import {AppDataSource} from '../../core/config/database';
import {Drug} from './entities/Drug';
import {DrugBatch} from './entities/DrugBatch';
import {StockMovement, MovementType} from './entities/StockMovement';
import {AppError} from '../../core/errors/AppError';
import {In} from 'typeorm';
import {paginate} from "../../core/utils/pagination";

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
        return this.drugRepo.findOne({where: {id}, relations: ['batches', 'batches.branch']});
    }

    async updateDrug(id: string, data: Partial<Drug>) {
        const drug = await this.drugRepo.findOne({where: {id}});
        if (!drug) throw new AppError('Drug not found', 404);
        Object.assign(drug, data);
        return this.drugRepo.save(drug);
    }

    // Batches
    async addBatch(data: Partial<DrugBatch>) {
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
        return AppDataSource.transaction(async (manager) => {
            const batch = await manager.findOne(DrugBatch, {
                where: {id: batchId},
                lock: {mode: 'pessimistic_write'},
            });
            if (!batch) throw new AppError('Batch not found', 404);
            if (batch.count < quantity) throw new AppError('Insufficient stock', 400);

            // Decrease source
            batch.count -= quantity;
            await manager.save(batch);

            // Find or create destination batch
            let destBatch = await manager.findOne(DrugBatch, {
                where: {drugId: batch.drugId, branchId: toBranchId, expirationDate: batch.expirationDate},
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

            // Record movement
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

    async getExpiringBatches(daysThreshold: number = 30) {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
        return this.batchRepo.find({
            where: {
                expirationDate: In([...Array(daysThreshold).keys()].map(d => {
                    const date = new Date();
                    date.setDate(date.getDate() + d);
                    return d;
                }))
            }, // simplified
            relations: ['drug', 'branch'],
        });
    }

    // src/modules/inventory/inventory.service.ts
    async getDrugsPaginated(pagination: { page?: number; limit?: number }) {
        const page = Math.max(1, pagination.page || 1);
        const limit = Math.min(100, Math.max(1, pagination.limit || 10));
        const skip = (page - 1) * limit;

        // Build the query that includes total stock per drug
        const baseQuery = this.drugRepo.createQueryBuilder('drug')
            .leftJoin('drug.batches', 'batch')
            .groupBy('drug.id')
            .select('drug')
            .addSelect('COALESCE(SUM(batch.count), 0)', 'totalStock')
            .orderBy('drug.enteringDate', 'DESC');

        // Get the total number of distinct drugs
        const totalResult = await this.drugRepo.createQueryBuilder('drug')
            .select('COUNT(DISTINCT drug.id)', 'count')
            .getRawOne();
        const total = parseInt((totalResult as any).count, 10) || 0;

        // Fetch the paginated raw rows + entities
        const {entities, raw} = await baseQuery
            .skip(skip)
            .take(limit)
            .getRawAndEntities();

        // Merge raw totalStock into each entity
        const items = entities.map((entity, index) => ({
            ...entity,
            totalStock: raw[index] ? parseInt(raw[index].totalStock, 10) : 0,
        }));

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
