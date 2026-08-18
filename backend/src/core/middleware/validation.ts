import {Request, Response, NextFunction} from 'express';
import {AnyZodObject, ZodError} from 'zod';
import {AppError} from '../errors/AppError';

export const validate = (schema: AnyZodObject) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });

            // Apply coerced/parsed values back so controllers get clean data
            if (parsed.body) req.body = parsed.body;
            if (parsed.query) req.query = parsed.query as any;
            if (parsed.params) req.params = parsed.params as any;

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const message = error.errors.map((e) => e.message).join(', ');
                return next(new AppError(message, 400));
            }
            next(error);
        }
    };
};
