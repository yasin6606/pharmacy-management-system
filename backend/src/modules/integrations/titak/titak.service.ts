import axios from 'axios';
import { env } from '../../../core/config/env';
import { AppDataSource } from '../../../core/config/database';
import { Drug } from '../../inventory/entities/Drug';
import { DrugBatch } from '../../inventory/entities/DrugBatch';
import { AppError } from '../../../core/errors/AppError';

export class TitakService {
  async updatePrice(drugId: string) {
    // Mock API call
    const response = await axios.get(`https://api.titak.ir/v1/drugs/${drugId}/price`, {
      headers: { Authorization: `Bearer ${env.TITAK_API_KEY}` },
    });
    const newPrice = response.data.price;

    await AppDataSource.transaction(async (manager) => {
      const drug = await manager.findOne(Drug, { where: { id: drugId } });
      if (!drug) throw new AppError('Drug not found', 404);
      drug.lastPriceUpdateDate = new Date();
      await manager.save(drug);

      await manager.update(DrugBatch, { drugId }, { sellingPrice: newPrice });
    });
    return { newPrice };
  }
}
