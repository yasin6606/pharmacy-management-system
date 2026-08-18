import {Request, Response, NextFunction} from 'express';
import {AppError} from '../errors/AppError';

export const requireRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError('Unauthorized', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new AppError('Insufficient permissions', 403));
        }
        next();
    };
};
