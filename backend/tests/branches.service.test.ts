import {BranchesService} from '../src/modules/branches/branches.service';
import {AppDataSource} from '../src/core/config/database';
import {AppError} from '../src/core/errors/AppError';

jest.mock('../src/core/config/database', () => ({
    AppDataSource: {getRepository: jest.fn()},
}));

describe('BranchesService', () => {
    let service: BranchesService;
    let repo: any;

    beforeEach(() => {
        repo = {
            create: jest.fn((d) => d),
            save: jest.fn(async (d) => ({id: 'b1', ...d})),
            find: jest.fn(),
            findOneBy: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
        };
        (AppDataSource.getRepository as jest.Mock).mockReturnValue(repo);
        service = new BranchesService();
    });

    it('creates a branch', async () => {
        const branch = await service.create({name: 'Main'});
        expect(branch.name).toBe('Main');
        expect(repo.save).toHaveBeenCalled();
    });

    it('update throws when not found', async () => {
        repo.findOneBy.mockResolvedValue(null);
        await expect(service.update('x', {name: 'N'})).rejects.toBeInstanceOf(AppError);
    });

    it('delete throws when nothing affected', async () => {
        repo.delete.mockResolvedValue({affected: 0});
        await expect(service.delete('x')).rejects.toMatchObject({statusCode: 404});
    });

    it('toggleFranchise flips flag', async () => {
        repo.findOneBy.mockResolvedValue({id: 'b1', hasFranchise: false});
        repo.save.mockImplementation(async (b) => b);
        const result = await service.toggleFranchise('b1');
        expect(result.hasFranchise).toBe(true);
    });
});
