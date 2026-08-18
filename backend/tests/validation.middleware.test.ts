import {z} from 'zod';
import {validate} from '../src/core/middleware/validation';
import {AppError} from '../src/core/errors/AppError';
import {Request, Response, NextFunction} from 'express';

describe('validate middleware', () => {
    const schema = z.object({
        body: z.object({
            email: z.string().email(),
            password: z.string().min(6),
        }),
    });

    it('calls next() on valid body', () => {
        const mw = validate(schema);
        const next = jest.fn();
        const req = {body: {email: 'a@b.com', password: 'secret1'}, query: {}, params: {}} as any;

        mw(req as Request, {} as Response, next as NextFunction);

        expect(next).toHaveBeenCalledWith();
        expect(req.body.email).toBe('a@b.com');
    });

    it('passes AppError 400 on invalid body', () => {
        const mw = validate(schema);
        const next = jest.fn();
        const req = {body: {email: 'bad', password: 'x'}, query: {}, params: {}} as any;

        mw(req as Request, {} as Response, next as NextFunction);

        expect(next).toHaveBeenCalled();
        const err = next.mock.calls[0][0];
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(400);
    });
});
