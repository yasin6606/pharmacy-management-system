import {asyncHandler} from '../src/core/utils/asyncHandler';
import {Request, Response, NextFunction} from 'express';

describe('asyncHandler', () => {
    it('forwards resolved handler without calling next with error', async () => {
        const handler = asyncHandler(async (_req: Request, res: Response) => {
            res.status(200).json({ok: true});
        });
        const res = {status: jest.fn().mockReturnThis(), json: jest.fn()} as any;
        const next = jest.fn();

        await handler({} as Request, res, next as NextFunction);
        // allow microtask queue for Promise.resolve().catch
        await Promise.resolve();

        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    it('forwards rejection to next', async () => {
        const err = new Error('fail');
        const handler = asyncHandler(async () => {
            throw err;
        });
        const next = jest.fn();

        handler({} as Request, {} as Response, next as NextFunction);
        await Promise.resolve();
        await Promise.resolve();

        expect(next).toHaveBeenCalledWith(err);
    });
});
