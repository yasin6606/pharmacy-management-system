import {NextFunction, Request, Response} from 'express';
import {verifyToken} from '../utils/jwt';
import {AppError} from '../errors/AppError';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
        throw new AppError('Authentication required', 401);
    }
    try {
        req.user = verifyToken(token);
        next();
    } catch (error) {
        throw new AppError('Invalid or expired token', 401);
    }
};
