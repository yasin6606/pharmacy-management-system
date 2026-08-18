import {Request, Response, NextFunction} from 'express';
import {AppError} from './AppError';
import {logger} from '../logger/logger';
import {env} from '../config/env';

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    const isOperational = err instanceof AppError && err.isOperational;

    if (isOperational) {
        logger.warn(`${err.message} [${req.method} ${req.path}]`);
    } else {
        logger.error(err.stack || err.message);
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }

    // TypeORM query failures
    if (err.name === 'QueryFailedError') {
        const message =
            env.NODE_ENV === 'development'
                ? err.message
                : 'Database operation failed';
        return res.status(400).json({
            success: false,
            message,
        });
    }

    // JWT errors that might slip through
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
        });
    }

    return res.status(500).json({
        success: false,
        message:
            env.NODE_ENV === 'development'
                ? err.message || 'Internal server error'
                : 'Internal server error',
    });
};
