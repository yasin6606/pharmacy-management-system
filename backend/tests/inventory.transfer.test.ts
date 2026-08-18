/**
 * Unit tests for InventoryService.transferStock.
 * Mocks AppDataSource.transaction to assert validation and stock movement logic
 * without a live database (covers concurrent-safe path design).
 */
import {InventoryService} from '../src/modules/inventory/inventory.service';
import {AppDataSource} from '../src/core/config/database';
import {AppError} from '../src/core/errors/AppError';

jest.mock('../src/core/config/database', () => ({
    AppDataSource: {
        getRepository: jest.fn(),
        transaction: jest.fn(),
    },
}));

describe('InventoryService.transferStock', () => {
    let service: InventoryService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new InventoryService();
    });

    it('rejects non-positive quantity', async () => {
        await expect(
            service.transferStock('batch-1', 'branch-b', 0, 'emp-1')
        ).rejects.toMatchObject({statusCode: 400, message: 'Quantity must be positive'});
    });

    it('rejects transfer to the same branch', async () => {
        (AppDataSource.transaction as jest.Mock).mockImplementation(async (cb) => {
            const manager = {
                findOne: jest.fn().mockResolvedValue({
                    id: 'batch-1',
                    count: 10,
                    branchId: 'branch-a',
                    drugId: 'drug-1',
                    expirationDate: new Date('2027-01-01'),
                    isOffer: false,
                    purchasePrice: 10,
                    sellingPrice: 15,
                }),
                save: jest.fn(),
                create: jest.fn(),
            };
            return cb(manager);
        });

        await expect(
            service.transferStock('batch-1', 'branch-a', 2, 'emp-1')
        ).rejects.toMatchObject({statusCode: 400, message: 'Cannot transfer to the same branch'});
    });

    it('rejects insufficient stock', async () => {
        (AppDataSource.transaction as jest.Mock).mockImplementation(async (cb) => {
            const manager = {
                findOne: jest.fn().mockResolvedValue({
                    id: 'batch-1',
                    count: 1,
                    branchId: 'branch-a',
                    drugId: 'drug-1',
                    expirationDate: new Date('2027-01-01'),
                    isOffer: false,
                    purchasePrice: 10,
                    sellingPrice: 15,
                }),
                save: jest.fn(),
                create: jest.fn(),
            };
            return cb(manager);
        });

        await expect(
            service.transferStock('batch-1', 'branch-b', 5, 'emp-1')
        ).rejects.toMatchObject({statusCode: 400, message: 'Insufficient stock'});
    });

    it('moves stock and records a transfer movement', async () => {
        const sourceBatch = {
            id: 'batch-1',
            count: 10,
            branchId: 'branch-a',
            drugId: 'drug-1',
            expirationDate: new Date('2027-01-01'),
            isOffer: false,
            purchasePrice: 10,
            sellingPrice: 15,
        };

        const save = jest.fn(async (entity) => entity);
        const create = jest.fn((_cls, data) => data);

        (AppDataSource.transaction as jest.Mock).mockImplementation(async (cb) => {
            const manager = {
                findOne: jest
                    .fn()
                    // source batch (locked)
                    .mockResolvedValueOnce({...sourceBatch})
                    // destination batch does not exist yet
                    .mockResolvedValueOnce(null),
                save,
                create,
            };
            return cb(manager);
        });

        const result = await service.transferStock('batch-1', 'branch-b', 4, 'emp-1');

        expect(result).toMatchObject({
            branchId: 'branch-b',
            count: 4,
            drugId: 'drug-1',
        });

        // source saved with reduced count + dest batch + movement
        expect(save).toHaveBeenCalled();
        const savedSource = save.mock.calls[0][0];
        expect(savedSource.count).toBe(6);
    });

    it('throws when source batch is missing', async () => {
        (AppDataSource.transaction as jest.Mock).mockImplementation(async (cb) => {
            const manager = {
                findOne: jest.fn().mockResolvedValue(null),
                save: jest.fn(),
                create: jest.fn(),
            };
            return cb(manager);
        });

        await expect(
            service.transferStock('missing', 'branch-b', 1, 'emp-1')
        ).rejects.toBeInstanceOf(AppError);
    });
});
