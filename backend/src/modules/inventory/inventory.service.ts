import {AppDataSource} from '../../core/config/database';
import {Drug} from './entities/Drug';
import {DrugBatch} from './entities/DrugBatch';
import {StockMovement, MovementType} from './entities/StockMovement';
import {AppError} from '../../core/errors/AppError';
import {ILike} from 'typeorm';

export class InventoryService {
    private drugRepo = AppDataSource.getRepository(Drug);
    private batchRepo = AppDataSource.getRepository(DrugBatch);
    private movementRepo = AppDataSource.getRepository(StockMovement);

    async createDrug(data: Partial<Drug>) {
        if (!data.name?.trim()) throw new AppError('Drug name is required', 400);
        if (!data.company?.trim()) throw new AppError('Company is required', 400);
        const drug = this.drugRepo.create({
            ...data,
            name: data.name.trim(),
            company: data.company.trim(),
            brand: data.brand?.trim() || null,
            enteringDate: data.enteringDate ? new Date(data.enteringDate as any) : new Date(),
        });
        return this.drugRepo.save(drug);
    }

    async getAllDrugs() {
        return this.drugRepo.find({relations: ['batches'], order: {name: 'ASC'}});
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
        if (data.name !== undefined) drug.name = String(data.name).trim();
        if (data.company !== undefined) drug.company = String(data.company).trim();
        if (data.brand !== undefined) drug.brand = data.brand ? String(data.brand).trim() : null;
        if (data.enteringDate !== undefined) drug.enteringDate = new Date(data.enteringDate as any);
        if (data.lastPriceUpdateDate !== undefined) {
            drug.lastPriceUpdateDate = data.lastPriceUpdateDate
                ? new Date(data.lastPriceUpdateDate as any)
                : null;
        }
        return this.drugRepo.save(drug);
    }

    /** Soft-safe delete: block if any batch still has stock. */
    async deleteDrug(id: string) {
        const drug = await this.drugRepo.findOne({
            where: {id},
            relations: ['batches'],
        });
        if (!drug) throw new AppError('Drug not found', 404);

        const stockLeft = (drug.batches || []).reduce((sum, b) => sum + Number(b.count || 0), 0);
        if (stockLeft > 0) {
            throw new AppError(
                `Cannot delete drug with remaining stock (${stockLeft} units). Zero out or transfer batches first.`,
                400
            );
        }

        await this.drugRepo.remove(drug);
        return true;
    }

    async addBatch(data: Partial<DrugBatch>) {
        if (!data.drugId || !data.branchId) {
            throw new AppError('drugId and branchId are required', 400);
        }
        if (data.count !== undefined && data.count < 0) {
            throw new AppError('Batch count cannot be negative', 400);
        }
        const drug = await this.drugRepo.findOne({where: {id: data.drugId}});
        if (!drug) throw new AppError('Drug not found', 404);

        const batch = this.batchRepo.create(data);
        return this.batchRepo.save(batch);
    }

    async getBatchesByBranch(branchId: string) {
        return this.batchRepo.find({
            where: {branchId},
            relations: ['drug'],
            order: {expirationDate: 'ASC'},
        });
    }

    async updateBatch(id: string, data: Partial<DrugBatch>) {
        const batch = await this.batchRepo.findOne({where: {id}});
        if (!batch) throw new AppError('Batch not found', 404);
        if (data.count !== undefined && data.count < 0) {
            throw new AppError('Batch count cannot be negative', 400);
        }
        if (data.expirationDate !== undefined) batch.expirationDate = new Date(data.expirationDate as any);
        if (data.count !== undefined) batch.count = data.count;
        if (data.isOffer !== undefined) batch.isOffer = data.isOffer;
        if (data.purchasePrice !== undefined) batch.purchasePrice = data.purchasePrice as any;
        if (data.sellingPrice !== undefined) batch.sellingPrice = data.sellingPrice as any;
        return this.batchRepo.save(batch);
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

    /**
     * Reliable catalog listing: count first, then page entities, then attach totalStock.
     * Avoids fragile GROUP BY + entity mapping that could return empty totals.
     */
    async getDrugsPaginated(pagination: {
        page?: number;
        limit?: number;
        search?: string;
    }) {
        const page = Math.max(1, pagination.page || 1);
        const limit = Math.min(100, Math.max(1, pagination.limit || 10));
        const skip = (page - 1) * limit;

        const where = pagination.search
            ? [
                  {name: ILike(`%${pagination.search}%`)},
                  {brand: ILike(`%${pagination.search}%`)},
                  {company: ILike(`%${pagination.search}%`)},
              ]
            : undefined;

        const [entities, total] = await this.drugRepo.findAndCount({
            where,
            order: {enteringDate: 'DESC', name: 'ASC'},
            skip,
            take: limit,
        });

        if (entities.length === 0) {
            return {items: [], total, page, limit, totalPages: Math.ceil(total / limit) || 0};
        }

        const ids = entities.map((d) => d.id);
        const stockRows = await this.batchRepo
            .createQueryBuilder('batch')
            .select('batch.drugId', 'drugId')
            .addSelect('COALESCE(SUM(batch.count), 0)', 'totalStock')
            .where('batch.drugId IN (:...ids)', {ids})
            .groupBy('batch.drugId')
            .getRawMany<{drugId: string; totalStock: string}>();

        const stockMap = new Map(stockRows.map((r) => [r.drugId, parseInt(r.totalStock, 10) || 0]));

        const items = entities.map((entity) => ({
            ...entity,
            totalStock: stockMap.get(entity.id) ?? 0,
        }));

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 0,
        };
    }

    /** Catalog + stock snapshot for dashboard KPIs. */
    async getCatalogStats() {
        const totalDrugs = await this.drugRepo.count();
        const batchAgg = await this.batchRepo
            .createQueryBuilder('batch')
            .select('COALESCE(SUM(batch.count), 0)', 'units')
            .addSelect('COUNT(batch.id)', 'batches')
            .getRawOne<{units: string; batches: string}>();

        return {
            totalDrugs,
            totalBatches: parseInt(String(batchAgg?.batches ?? '0'), 10) || 0,
            totalUnits: Number(batchAgg?.units ?? 0),
        };
    }
}
