import {authMiddleware} from '../src/core/middleware/auth';
import {signToken} from '../src/core/utils/jwt';
import {AppError} from '../src/core/errors/AppError';
import {AppDataSource} from '../src/core/config/database';
import {EmployeeSession} from '../src/modules/auth/entities/EmployeeSession';
import {Employee} from '../src/modules/employees/entities/Employee';
import {Request, Response, NextFunction} from 'express';

jest.mock('../src/core/config/database', () => ({
    AppDataSource: {getRepository: jest.fn()},
}));

describe('authMiddleware', () => {
    const sessionRepo = {findOne: jest.fn()};
    const employeeRepo = {findOne: jest.fn()};

    beforeEach(() => {
        jest.clearAllMocks();
        (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: unknown) => {
            if (entity === EmployeeSession) return sessionRepo;
            if (entity === Employee) return employeeRepo;
            return sessionRepo;
        });
    });

    it('rejects missing token', async () => {
        const next = jest.fn();
        const req = {headers: {}, cookies: {}} as any;
        await authMiddleware(req as Request, {} as Response, next as NextFunction);
        const err = next.mock.calls[0][0];
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(401);
    });

    it('attaches req.user from DB role when session + active employee', async () => {
        sessionRepo.findOne.mockResolvedValue({
            id: 's-1',
            employeeId: 'u-1',
            logoutTime: null,
        });
        employeeRepo.findOne.mockResolvedValue({
            id: 'u-1',
            role: 'senior',
            currentBranchId: 'b-2',
            isActive: true,
        });

        const token = signToken({
            userId: 'u-1',
            role: 'manager',
            branchId: 'b-1',
            sessionId: 's-1',
        });
        const next = jest.fn();
        const req = {
            headers: {authorization: `Bearer ${token}`},
            cookies: {},
        } as any;

        await authMiddleware(req as Request, {} as Response, next as NextFunction);

        expect(next).toHaveBeenCalledWith();
        expect(req.user).toMatchObject({
            userId: 'u-1',
            role: 'senior',
            branchId: 'b-2',
            sessionId: 's-1',
        });
    });

    it('rejects disabled employee', async () => {
        sessionRepo.findOne.mockResolvedValue({id: 's-1', employeeId: 'u-1', logoutTime: null});
        employeeRepo.findOne.mockResolvedValue({id: 'u-1', role: 'manager', isActive: false});

        const token = signToken({
            userId: 'u-1',
            role: 'manager',
            branchId: 'b-1',
            sessionId: 's-1',
        });
        const next = jest.fn();
        const req = {headers: {authorization: `Bearer ${token}`}, cookies: {}} as any;
        await authMiddleware(req as Request, {} as Response, next as NextFunction);
        const err = next.mock.calls[0][0];
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(401);
    });

    it('rejects token when session is logged out', async () => {
        sessionRepo.findOne.mockResolvedValue(null);

        const token = signToken({
            userId: 'u-1',
            role: 'manager',
            branchId: 'b-1',
            sessionId: 's-1',
        });
        const next = jest.fn();
        const req = {headers: {authorization: `Bearer ${token}`}, cookies: {}} as any;
        await authMiddleware(req as Request, {} as Response, next as NextFunction);
        const err = next.mock.calls[0][0];
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(401);
    });

    it('rejects invalid token', async () => {
        const next = jest.fn();
        const req = {
            headers: {authorization: 'Bearer not-a-jwt'},
            cookies: {},
        } as any;
        await authMiddleware(req as Request, {} as Response, next as NextFunction);
        const err = next.mock.calls[0][0];
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(401);
    });
});
