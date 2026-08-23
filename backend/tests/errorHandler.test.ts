import {errorHandler} from '../src/core/errors/errorHandler';
import {AppError} from '../src/core/errors/AppError';
import {Request, Response, NextFunction} from 'express';

function mockRes() {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function mockReq(partial: Partial<Request> = {}): Request {
    return {
        method: 'GET',
        path: '/x',
        originalUrl: '/x',
        headers: {},
        ...partial,
    } as Request;
}

describe('errorHandler', () => {
    it('returns AppError status and message', () => {
        const res = mockRes();
        errorHandler(
            new AppError('nope', 403),
            mockReq(),
            res as Response,
            jest.fn() as NextFunction
        );
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: 'nope',
                code: 'FORBIDDEN',
            })
        );
    });

    it('maps QueryFailedError to 400', () => {
        const res = mockRes();
        const err = new Error('duplicate key');
        err.name = 'QueryFailedError';
        errorHandler(err, mockReq({method: 'POST'} as any), res as Response, jest.fn() as NextFunction);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({success: false, code: 'DATABASE_ERROR'})
        );
    });

    it('maps JWT errors to 401', () => {
        const res = mockRes();
        const err = new Error('jwt expired');
        err.name = 'TokenExpiredError';
        errorHandler(err, mockReq(), res as Response, jest.fn() as NextFunction);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({success: false, code: 'UNAUTHORIZED'})
        );
    });

    it('returns 500 for unexpected errors', () => {
        const res = mockRes();
        errorHandler(
            new Error('boom'),
            mockReq(),
            res as Response,
            jest.fn() as NextFunction
        );
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({success: false})
        );
    });
});
