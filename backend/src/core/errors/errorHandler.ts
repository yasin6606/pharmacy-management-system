import {Request, Response, NextFunction} from 'express';
import {ZodError} from 'zod';
import {AppError} from './AppError';
import {logger} from '../logger/logger';
import {env} from '../config/env';

function requestId(req: Request): string {
    return (req.headers['x-request-id'] as string) || (req as any).id || '-';
}

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    const rid = requestId(req);
    const path = `${req.method} ${req.originalUrl || req.path}`;

    // ---- Zod validation ----
    if (err instanceof ZodError) {
        const details = err.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
        }));
        logger.warn('Validation failed', {requestId: rid, path, details});
        return res.status(400).json({
            success: false,
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details,
            requestId: rid,
        });
    }

    // ---- Known operational errors ----
    if (err instanceof AppError) {
        const level = err.isOperational ? 'warn' : 'error';
        logger[level](err.message, {
            requestId: rid,
            path,
            code: err.code,
            statusCode: err.statusCode,
            details: err.details,
            stack: err.isOperational ? undefined : err.stack,
        });

        return res.status(err.statusCode).json({
            success: false,
            code: err.code,
            message: err.message,
            ...(env.NODE_ENV === 'development' && err.details ? {details: err.details} : {}),
            requestId: rid,
        });
    }

    // ---- TypeORM ----
    if (err.name === 'QueryFailedError') {
        logger.error('Database query failed', {
            requestId: rid,
            path,
            message: err.message,
            stack: env.NODE_ENV === 'development' ? err.stack : undefined,
        });
        return res.status(400).json({
            success: false,
            code: 'DATABASE_ERROR',
            message:
                env.NODE_ENV === 'development' ? err.message : 'Database operation failed',
            requestId: rid,
        });
    }

    // ---- JWT ----
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        logger.warn('JWT rejected', {requestId: rid, path, name: err.name});
        return res.status(401).json({
            success: false,
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired token',
            requestId: rid,
        });
    }

    // ---- Syntax / body parser ----
    if (err instanceof SyntaxError && 'body' in err) {
        logger.warn('Malformed JSON body', {requestId: rid, path});
        return res.status(400).json({
            success: false,
            code: 'BAD_REQUEST',
            message: 'Malformed JSON body',
            requestId: rid,
        });
    }

    // ---- Unexpected ----
    logger.error('Unhandled error', {
        requestId: rid,
        path,
        message: err.message,
        stack: err.stack,
        name: err.name,
    });

    return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message:
            env.NODE_ENV === 'development'
                ? err.message || 'Internal server error'
                : 'Internal server error',
        requestId: rid,
    });
};
