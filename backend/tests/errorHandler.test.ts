import {errorHandler} from '../src/core/errors/errorHandler';
import {AppError} from '../src/core/errors/AppError';
import {Request, Response, NextFunction} from 'express';

function mockRes() {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('errorHandler', () => {
    it('returns AppError status and message', () => {
        const res = mockRes();
        errorHandler(
            new AppError('nope', 403),
            {method: 'GET', path: '/x'} as Request,
            res as Response,
            jest.fn() as NextFunction
        );
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({success: false, message: 'nope'});
    });

    it('maps QueryFailedError to 400', () => {
        const res = mockRes();
        const err = new Error('duplicate key');
        err.name = 'QueryFailedError';
        errorHandler(err, {method: 'POST', path: '/x'} as Request, res as Response, jest.fn() as NextFunction);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('maps JWT errors to 401', () => {
        const res = mockRes();
        const err = new Error('jwt expired');
        err.name = 'TokenExpiredError';
        errorHandler(err, {method: 'GET', path: '/x'} as Request, res as Response, jest.fn() as NextFunction);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 500 for unexpected errors', () => {
        const res = mockRes();
        errorHandler(
            new Error('boom'),
            {method: 'GET', path: '/x'} as Request,
            res as Response,
            jest.fn() as NextFunction
        );
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({success: false})
        );
    });
});
