import { AppDataSource } from '../../core/config/database';
import { PurchaseOrder } from './entities/PurchaseOrder';
import { Supplier } from './entities/Supplier';
import { ocrClient } from './ocr/ocrClient';

export class PurchasingService {
  private poRepo = AppDataSource.getRepository(PurchaseOrder);
  private supplierRepo = AppDataSource.getRepository(Supplier);

  async createOrder(data: Partial<PurchaseOrder>) {
    const order = this.poRepo.create(data);
    return this.poRepo.save(order);
  }

  async processInvoiceImage(imageBuffer: Buffer) {
    const ocrResult = await ocrClient.parseInvoice(imageBuffer);
    // Return structured preview
    return ocrResult;
  }
}
