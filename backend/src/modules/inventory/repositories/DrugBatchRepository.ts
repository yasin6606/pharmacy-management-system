import { Repository } from 'typeorm';
import { AppDataSource } from '../../../core/config/database';
import { DrugBatch } from '../entities/DrugBatch';

export class DrugBatchRepository extends Repository<DrugBatch> {
  constructor() {
    super(DrugBatch, AppDataSource.manager);
  }

  async findByBranch(branchId: string): Promise<DrugBatch[]> {
    return this.find({ where: { branchId }, relations: ['drug'] });
  }

  async findExpiringBetween(startDate: Date, endDate: Date): Promise<DrugBatch[]> {
    return this.createQueryBuilder('batch')
      .leftJoinAndSelect('batch.drug', 'drug')
      .leftJoinAndSelect('batch.branch', 'branch')
      .where('batch.expirationDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getMany();
  }

  async decrementStock(batchId: string, quantity: number): Promise<void> {
    await this.createQueryBuilder()
      .update()
      .set({ count: () => `count - ${quantity}` })
      .where('id = :id', { id: batchId })
      .execute();
  }
}
