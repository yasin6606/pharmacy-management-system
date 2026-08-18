import {LossReportsService} from '../src/modules/loss-reports/loss-reports.service';
import {AppDataSource} from '../src/core/config/database';
import {AppError} from '../src/core/errors/AppError';

jest.mock('../src/core/config/database', () => ({
    AppDataSource: {
        getRepository: jest.fn(),
        transaction: jest.fn(),
    },
}));

// Mirror enum values used in service
const PENDING = 'pending';
const APPROVED = 'approved';
const REJECTED = 'rejected';

describe('LossReportsService.review', () => {
    let service: LossReportsService;

    beforeEach(() => {
        (AppDataSource.getRepository as jest.Mock).mockReturnValue({});
        service = new LossReportsService();
    });

    it('404 when report missing', async () => {
        (AppDataSource.transaction as jest.Mock).mockImplementation(async (cb) => {
            const manager = {
                findOne: jest.fn().mockResolvedValue(null),
                save: jest.fn(),
            };
            return cb(manager);
        });

        await expect(
            service.review('r1', APPROVED as any, 'reviewer-1')
        ).rejects.toMatchObject({statusCode: 404});
    });

    it('rejects already reviewed reports', async () => {
        (AppDataSource.transaction as jest.Mock).mockImplementation(async (cb) => {
            const manager = {
                findOne: jest.fn().mockResolvedValue({
                    id: 'r1',
                    status: APPROVED,
                }),
                save: jest.fn(),
            };
            return cb(manager);
        });

        await expect(
            service.review('r1', REJECTED as any, 'reviewer-1')
        ).rejects.toMatchObject({message: 'Report already reviewed'});
    });

    it('approves and decrements stock (FIFO batch)', async () => {
        const batch = {id: 'batch-1', count: 10, drugId: 'd1', branchId: 'b1'};
        const save = jest.fn(async (x) => x);

        (AppDataSource.transaction as jest.Mock).mockImplementation(async (cb) => {
            const manager = {
                findOne: jest
                    .fn()
                    .mockResolvedValueOnce({
                        id: 'r1',
                        status: PENDING,
                        drugId: 'd1',
                        branchId: 'b1',
                        quantity: 3,
                    })
                    .mockResolvedValueOnce(batch),
                save,
            };
            return cb(manager);
        });

        const report = await service.review('r1', APPROVED as any, 'rev-1');
        expect(batch.count).toBe(7);
        expect(report.status).toBe(APPROVED);
        expect(save).toHaveBeenCalled();
    });
});
