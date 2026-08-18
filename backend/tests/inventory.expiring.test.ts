import {InventoryService} from '../src/modules/inventory/inventory.service';
import {AppDataSource} from '../src/core/config/database';

jest.mock('../src/core/config/database', () => ({
    AppDataSource: {
        getRepository: jest.fn(),
        transaction: jest.fn(),
    },
}));

describe('InventoryService.getExpiringBatches', () => {
    it('queries batches within date window with stock', async () => {
        const getMany = jest.fn().mockResolvedValue([{id: 'b1'}]);
        const qb: any = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany,
        };

        const batchRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(qb),
        };

        (AppDataSource.getRepository as jest.Mock)
            .mockReturnValueOnce({}) // drugRepo
            .mockReturnValueOnce(batchRepo) // batchRepo
            .mockReturnValueOnce({}); // movementRepo

        const service = new InventoryService();
        const result = await service.getExpiringBatches(30);

        expect(result).toEqual([{id: 'b1'}]);
        expect(batchRepo.createQueryBuilder).toHaveBeenCalledWith('batch');
        expect(qb.andWhere).toHaveBeenCalledWith('batch.count > 0');
    });
});
