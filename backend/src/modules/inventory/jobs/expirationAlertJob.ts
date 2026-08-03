import cron from 'node-cron';
import { InventoryService } from '../inventory.service';
import { logger } from '../../../core/logger/logger';

export const startExpirationAlertJob = () => {
    cron.schedule('0 9 * * *', async () => {
        logger.info('Running expiration alert job');
        const service = new InventoryService();
        const expiring = await service.getExpiringBatches(30);
        // In production, store notifications in DB
        logger.info(`Found ${expiring.length} batches expiring within 30 days`);
        expiring.forEach(batch => {
            logger.warn(`Batch ${batch.id} of drug ${batch.drug.name} at branch ${batch.branchId} expires on ${batch.expirationDate}`);
        });
    });
};
