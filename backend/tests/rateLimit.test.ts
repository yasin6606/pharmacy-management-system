import {Request, Response, NextFunction} from 'express';
import {
    MemoryRateLimitStore,
    rateLimit,
    setRateLimitStore,
} from '../src/core/middleware/rateLimit';
import {AppError} from '../src/core/errors/AppError';

function mockReq(ip = '127.0.0.1'): Partial<Request> {
    return {ip, socket: {remoteAddress: ip} as any};
}

describe('MemoryRateLimitStore', () => {
    let store: MemoryRateLimitStore;

    beforeEach(() => {
        store = new MemoryRateLimitStore();
    });

    it('increments count within the same window', async () => {
        const a = await store.incr('user:1', 60_000);
        const b = await store.incr('user:1', 60_000);
        expect(a.count).toBe(1);
        expect(b.count).toBe(2);
        expect(b.resetAt).toBe(a.resetAt);
    });

    it('isolates different keys', async () => {
        await store.incr('a', 60_000);
        const b = await store.incr('b', 60_000);
        expect(b.count).toBe(1);
    });
});

describe('rateLimit middleware', () => {
    let store: MemoryRateLimitStore;
    let next: jest.Mock;

    beforeEach(() => {
        store = new MemoryRateLimitStore();
        setRateLimitStore(store);
        next = jest.fn();
    });

    it('allows requests under the max', async () => {
        const mw = rateLimit({windowMs: 60_000, max: 3, store});

        await mw(mockReq() as Request, {} as Response, next);
        await mw(mockReq() as Request, {} as Response, next);
        await mw(mockReq() as Request, {} as Response, next);

        expect(next).toHaveBeenCalledTimes(3);
        // All calls should be next() without AppError
        next.mock.calls.forEach(([arg]) => expect(arg).toBeUndefined());
    });

    it('blocks when max is exceeded with 429 AppError', async () => {
        const mw = rateLimit({
            windowMs: 60_000,
            max: 2,
            store,
            message: 'blocked',
        });

        await mw(mockReq() as Request, {} as Response, next);
        await mw(mockReq() as Request, {} as Response, next);
        await mw(mockReq() as Request, {} as Response, next);

        const lastArg = next.mock.calls[2][0];
        expect(lastArg).toBeInstanceOf(AppError);
        expect((lastArg as AppError).statusCode).toBe(429);
        expect((lastArg as AppError).message).toBe('blocked');
    });
});
