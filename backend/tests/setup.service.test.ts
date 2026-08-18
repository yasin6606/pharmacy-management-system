import {SetupService} from '../src/modules/setup/setup.service';
import {AppDataSource} from '../src/core/config/database';
import {AppError} from '../src/core/errors/AppError';

jest.mock('../src/core/config/database', () => ({
    AppDataSource: {getRepository: jest.fn()},
}));

describe('SetupService', () => {
    let service: SetupService;
    let repo: any;

    beforeEach(() => {
        repo = {
            count: jest.fn(),
            create: jest.fn((d) => d),
            save: jest.fn(async (d) => ({...d, id: 'mgr-1'})),
        };
        (AppDataSource.getRepository as jest.Mock).mockReturnValue(repo);
        service = new SetupService();
    });

    it('creates first manager when no employees exist', async () => {
        repo.count.mockResolvedValue(0);
        const result = await service.createFirstManager({
            email: 'admin@pharm.com',
            password: 'secret12',
            fullName: 'Admin',
        });
        expect(result).toEqual({id: 'mgr-1', email: 'admin@pharm.com'});
        expect(repo.save).toHaveBeenCalled();
    });

    it('rejects when setup already completed', async () => {
        repo.count.mockResolvedValue(3);
        await expect(
            service.createFirstManager({
                email: 'x@y.com',
                password: 'secret12',
                fullName: 'X',
            })
        ).rejects.toMatchObject({statusCode: 400, message: 'Setup already completed'});
    });
});
