import {NextFunction, Request, Response} from 'express';
import {verifyToken} from '../utils/jwt';
import {AppError} from '../errors/AppError';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            return next(new AppError('Authentication required', 401));
        }

        const payload = verifyToken(token);
        if (!payload || !payload.userId) {
            return next(new AppError('Invalid or expired token', 401));
        }

        req.user = {
            userId: payload.userId,
            role: payload.role,
            branchId: payload.branchId,
            sessionId: payload.sessionId,
        };
        next();
    } catch {
        next(new AppError('Invalid or expired token', 401));
    }
};
