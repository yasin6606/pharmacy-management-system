import { Repository } from 'typeorm';
import { AppDataSource } from '../../../core/config/database';
import { Drug } from '../entities/Drug';

export class DrugRepository extends Repository<Drug> {
  constructor() {
    super(Drug, AppDataSource.manager);
  }

  async findWithBatches(id: string): Promise<Drug | null> {
    return this.findOne({ where: { id }, relations: ['batches', 'batches.branch'] });
  }

  async findAllWithBatches(): Promise<Drug[]> {
    return this.find({ relations: ['batches'] });
  }
}
