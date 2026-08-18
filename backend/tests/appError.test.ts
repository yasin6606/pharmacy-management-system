import {AppError} from '../src/core/errors/AppError';

describe('AppError', () => {
    it('stores statusCode and marks operational by default', () => {
        const err = new AppError('not found', 404);
        expect(err.message).toBe('not found');
        expect(err.statusCode).toBe(404);
        expect(err.isOperational).toBe(true);
        expect(err).toBeInstanceOf(Error);
    });

    it('can mark non-operational errors', () => {
        const err = new AppError('boom', 500, false);
        expect(err.isOperational).toBe(false);
    });
});
