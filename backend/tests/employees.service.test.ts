import {EmployeesService} from '../src/modules/employees/employees.service';
import {AppDataSource} from '../src/core/config/database';
import {AppError} from '../src/core/errors/AppError';

jest.mock('../src/core/config/database', () => ({
    AppDataSource: {getRepository: jest.fn()},
}));

describe('EmployeesService', () => {
    let service: EmployeesService;
    let employeeRepo: any;
    let branchRepo: any;
    let historyRepo: any;
    let sessionRepo: any;

    beforeEach(() => {
        employeeRepo = {
            findOne: jest.fn(),
            create: jest.fn((d) => d),
            save: jest.fn(async (d) => ({id: 'e1', ...d})),
            find: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
        };
        branchRepo = {findOneBy: jest.fn()};
        historyRepo = {save: jest.fn()};
        sessionRepo = {find: jest.fn()};

        (AppDataSource.getRepository as jest.Mock)
            .mockReturnValueOnce(employeeRepo)
            .mockReturnValueOnce(branchRepo)
            .mockReturnValueOnce(historyRepo)
            .mockReturnValueOnce(sessionRepo);

        service = new EmployeesService();
    });

    it('create rejects duplicate email', async () => {
        employeeRepo.findOne.mockResolvedValue({id: 'existing'});
        await expect(
            service.create({email: 'a@b.com', password: 'secret12', fullName: 'A', role: 'junior' as any})
        ).rejects.toMatchObject({statusCode: 400});
    });

    it('create requires password', async () => {
        employeeRepo.findOne.mockResolvedValue(null);
        await expect(
            service.create({email: 'a@b.com', fullName: 'A', role: 'junior' as any})
        ).rejects.toMatchObject({message: 'Password is required'});
    });

    it('create hashes password and strips it from response', async () => {
        employeeRepo.findOne.mockResolvedValue(null);
        const result = await service.create({
            email: 'a@b.com',
            password: 'secret12',
            fullName: 'A',
            role: 'junior' as any,
        });
        expect((result as any).passwordHash).toBeUndefined();
        expect((result as any).password).toBeUndefined();
        expect(employeeRepo.save).toHaveBeenCalled();
    });

    it('findById 404', async () => {
        employeeRepo.findOne.mockResolvedValue(null);
        await expect(service.findById('x')).rejects.toMatchObject({statusCode: 404});
    });

    it('delete 404 when not found', async () => {
        employeeRepo.delete.mockResolvedValue({affected: 0});
        await expect(service.delete('x')).rejects.toBeInstanceOf(AppError);
    });
});
