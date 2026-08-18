import {requireRole} from '../src/core/middleware/rbac';
import {AppError} from '../src/core/errors/AppError';
import {Request, Response, NextFunction} from 'express';

describe('requireRole', () => {
    it('rejects unauthenticated request', () => {
        const mw = requireRole('manager');
        const next = jest.fn();
        mw({} as Request, {} as Response, next as NextFunction);

        const err = next.mock.calls[0][0];
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(401);
    });

    it('rejects insufficient role', () => {
        const mw = requireRole('manager');
        const next = jest.fn();
        const req = {user: {role: 'junior'}} as any;
        mw(req, {} as Response, next as NextFunction);

        const err = next.mock.calls[0][0];
        expect(err.statusCode).toBe(403);
    });

    it('allows matching role', () => {
        const mw = requireRole('manager', 'senior');
        const next = jest.fn();
        const req = {user: {role: 'senior'}} as any;
        mw(req, {} as Response, next as NextFunction);
        expect(next).toHaveBeenCalledWith();
    });
});
