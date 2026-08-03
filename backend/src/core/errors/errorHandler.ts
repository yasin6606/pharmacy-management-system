import {Request, Response, NextFunction} from 'express';
import {AppError} from './AppError';
import {logger} from '../logger/logger';

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    logger.error(err.stack);

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }

    // TypeORM errors
    if (err.name === 'QueryFailedError') {
        return res.status(400).json({
            success: false,
            message: 'Database operation failed',
        });
    }

    return res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
};
