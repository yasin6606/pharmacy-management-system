/**
 * Unit tests for SalesService.recordBatchSale critical path.
 *
 * AppDataSource.transaction is mocked so we can assert:
 *  - validation failures (no branch, empty items, bad qty)
 *  - insufficient stock / wrong branch
 *  - successful multi-item sale decrements stock & writes movements
 * without needing a live PostgreSQL instance.
 */
import {SalesService} from '../src/modules/sales/sales.service';
import {AppError} from '../src/core/errors/AppError';
import {AppDataSource} from '../src/core/config/database';

jest.mock('../src/core/config/database', () => ({
    AppDataSource: {
        getRepository: jest.fn(),
        transaction: jest.fn(),
    },
}));

describe('SalesService.recordBatchSale', () => {
    let service: SalesService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new SalesService();
    });

    it('rejects when branchId is missing', async () => {
        await expect(
            service.recordBatchSale([{drugBatchId: 'b1', quantity: 1}], 'emp-1', '')
        ).rejects.toMatchObject({statusCode: 400, message: 'No branch assigned'});
    });

    it('rejects empty item list', async () => {
        await expect(
            service.recordBatchSale([], 'emp-1', 'branch-1')
        ).rejects.toMatchObject({
            statusCode: 400,
            message: 'Sale must contain at least one item',
        });
    });

    it('rejects non-positive quantity inside the transaction', async () => {
        (AppDataSource.transaction as jest.Mock).mockImplementation(async (cb) => {
            const manager = {
                findOne: jest.fn()
                    .mockResolvedValueOnce({value: '0'}) // franchise setting
                    .mockResolvedValueOnce({hasFranchise: false}), // branch
            };
            return cb(manager);
        });

        await expect(
            service.recordBatchSale(
                [{drugBatchId: 'b1', quantity: 0}],
                'emp-1',
                'branch-1'
            )
        ).rejects.toBeInstanceOf(AppError);
    });

    it('throws on insufficient stock under pessimistic lock', async () => {
        (AppDataSource.transaction as jest.Mock).mockImplementation(async (cb) => {
            const manager = {
                findOne: jest
                    .fn()
                    .mockResolvedValueOnce(null) // no franchise setting
                    .mockResolvedValueOnce({hasFranchise: false})
                    .mockResolvedValueOnce({
                        id: 'batch-1',
                        count: 2,
                        branchId: 'branch-1',
                        drugId: 'drug-1',
                        sellingPrice: 100,
                        isOffer: false,
                    }),
                decrement: jest.fn(),
                insert: jest.fn(),
                update: jest.fn(),
            };
            return cb(manager);
        });

        await expect(
            service.recordBatchSale(
                [{drugBatchId: 'batch-1', quantity: 5}],
                'emp-1',
                'branch-1'
            )
        ).rejects.toMatchObject({statusCode: 400});
    });

    it('throws when batch belongs to another branch', async () => {
        (AppDataSource.transaction as jest.Mock).mockImplementation(async (cb) => {
            const manager = {
                findOne: jest
                    .fn()
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce({hasFranchise: false})
                    .mockResolvedValueOnce({
                        id: 'batch-1',
                        count: 10,
                        branchId: 'other-branch',
                        drugId: 'drug-1',
                        sellingPrice: 50,
                        isOffer: false,
                    }),
                decrement: jest.fn(),
                insert: jest.fn(),
                update: jest.fn(),
            };
            return cb(manager);
        });

        await expect(
            service.recordBatchSale(
                [{drugBatchId: 'batch-1', quantity: 1}],
                'emp-1',
                'branch-1'
            )
        ).rejects.toMatchObject({statusCode: 400});
    });

    it('decrements stock and writes sale + movement on success', async () => {
        const decrement = jest.fn();
        const insert = jest.fn()
            .mockResolvedValueOnce({identifiers: [{id: 'sale-1'}]}) // sale
            .mockResolvedValueOnce({}); // movement

        (AppDataSource.transaction as jest.Mock).mockImplementation(async (cb) => {
            const manager = {
                findOne: jest
                    .fn()
                    .mockResolvedValueOnce({value: '10'}) // franchise amount
                    .mockResolvedValueOnce({hasFranchise: true})
                    .mockResolvedValueOnce({
                        id: 'batch-1',
                        count: 10,
                        branchId: 'branch-1',
                        drugId: 'drug-1',
                        sellingPrice: 100,
                        isOffer: false,
                    }),
                decrement,
                insert,
                update: jest.fn().mockResolvedValue({}),
            };
            return cb(manager);
        });

        const ok = await service.recordBatchSale(
            [{drugBatchId: 'batch-1', quantity: 3}],
            'emp-1',
            'branch-1',
            {method: 'cash'}
        );

        expect(ok).toBe(true);
        expect(decrement).toHaveBeenCalledWith(
            expect.anything(),
            {id: 'batch-1'},
            'count',
            3
        );
        // sale row + stock movement
        expect(insert).toHaveBeenCalledTimes(2);
    });
});
