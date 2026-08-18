import bcrypt from 'bcryptjs';
import {AuthService} from '../src/modules/auth/auth.service';
import {AppDataSource} from '../src/core/config/database';
import {AppError} from '../src/core/errors/AppError';

jest.mock('../src/core/config/database', () => ({
    AppDataSource: {
        getRepository: jest.fn(),
    },
}));

describe('AuthService', () => {
    let service: AuthService;
    let employeeRepo: any;
    let sessionRepo: any;

    beforeEach(() => {
        employeeRepo = {
            findOne: jest.fn(),
        };
        sessionRepo = {
            create: jest.fn((x) => x),
            save: jest.fn(async (x) => ({...x, id: 'sess-1'})),
            update: jest.fn(),
        };

        (AppDataSource.getRepository as jest.Mock)
            .mockReturnValueOnce(employeeRepo) // Employee
            .mockReturnValueOnce(sessionRepo); // EmployeeSession

        service = new AuthService();
    });

    it('login succeeds and strips passwordHash', async () => {
        const hash = await bcrypt.hash('secret12', 10);
        employeeRepo.findOne.mockResolvedValue({
            id: 'emp-1',
            email: 'a@b.com',
            passwordHash: hash,
            role: 'manager',
            currentBranchId: 'br-1',
            fullName: 'Admin',
        });

        const result = await service.login('a@b.com', 'secret12', '127.0.0.1');

        expect(result.token).toBeTruthy();
        expect((result.employee as any).passwordHash).toBeUndefined();
        expect(result.employee?.id).toBe('emp-1');
        expect(sessionRepo.save).toHaveBeenCalled();
    });

    it('login fails with invalid credentials', async () => {
        employeeRepo.findOne.mockResolvedValue(null);
        await expect(service.login('x@y.com', 'nope', '1.1.1.1')).rejects.toMatchObject({
            statusCode: 401,
        });
    });

    it('logout requires sessionId', async () => {
        await expect(service.logout('')).rejects.toBeInstanceOf(AppError);
    });

    it('getProfile returns sanitized user', async () => {
        // Re-bind repos: AuthService already constructed; override private fields via repo mocks on new instance
        employeeRepo.findOne.mockResolvedValue({
            id: 'emp-1',
            passwordHash: 'hash',
            email: 'a@b.com',
            fullName: 'A',
        });

        // Reconstruct so getRepository order applies again
        (AppDataSource.getRepository as jest.Mock)
            .mockReset()
            .mockReturnValueOnce(employeeRepo)
            .mockReturnValueOnce(sessionRepo);
        service = new AuthService();

        const profile = await service.getProfile('emp-1');
        expect((profile as any).passwordHash).toBeUndefined();
        expect(profile?.id).toBe('emp-1');
    });

    it('getProfile 404 when missing', async () => {
        (AppDataSource.getRepository as jest.Mock)
            .mockReset()
            .mockReturnValueOnce(employeeRepo)
            .mockReturnValueOnce(sessionRepo);
        employeeRepo.findOne.mockResolvedValue(null);
        service = new AuthService();

        await expect(service.getProfile('missing')).rejects.toMatchObject({statusCode: 404});
    });
});
