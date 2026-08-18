import {authMiddleware} from '../src/core/middleware/auth';
import {signToken} from '../src/core/utils/jwt';
import {AppError} from '../src/core/errors/AppError';
import {Request, Response, NextFunction} from 'express';

describe('authMiddleware', () => {
    it('rejects missing token', () => {
        const next = jest.fn();
        const req = {headers: {}, cookies: {}} as any;

        authMiddleware(req as Request, {} as Response, next as NextFunction);

        const err = next.mock.calls[0][0];
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(401);
    });

    it('attaches req.user from valid Bearer token', () => {
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

        authMiddleware(req as Request, {} as Response, next as NextFunction);

        expect(next).toHaveBeenCalledWith();
        expect(req.user).toMatchObject({
            userId: 'u-1',
            role: 'manager',
            branchId: 'b-1',
            sessionId: 's-1',
        });
    });

    it('rejects invalid token', () => {
        const next = jest.fn();
        const req = {
            headers: {authorization: 'Bearer not-a-jwt'},
            cookies: {},
        } as any;

        authMiddleware(req as Request, {} as Response, next as NextFunction);

        const err = next.mock.calls[0][0];
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(401);
    });
});
