import {NextFunction, Request, Response} from 'express';
import {IsNull} from 'typeorm';
import {verifyToken, JwtPayload} from '../utils/jwt';
import {AppError} from '../errors/AppError';
import {AppDataSource} from '../config/database';
import {EmployeeSession} from '../../modules/auth/entities/EmployeeSession';

/**
 * Authenticate request via Bearer token or cookie.
 * Also enforces server-side session validity (logout / missing session rejects the JWT).
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            return next(new AppError('Authentication required', 401));
        }

        let payload: JwtPayload;
        try {
            payload = verifyToken(token);
        } catch {
            return next(new AppError('Invalid or expired token', 401));
        }

        if (!payload?.userId || !payload?.sessionId) {
            return next(new AppError('Invalid or expired token', 401));
        }

        // Reject tokens whose session was logged out or never existed
        const sessionRepo = AppDataSource.getRepository(EmployeeSession);
        const session = await sessionRepo.findOne({
            where: {
                id: payload.sessionId,
                employeeId: payload.userId,
                logoutTime: IsNull(),
            },
        });

        if (!session) {
            return next(new AppError('Session expired or logged out', 401));
        }

        req.user = {
            userId: payload.userId,
            role: payload.role,
            branchId: payload.branchId ?? undefined,
            sessionId: payload.sessionId,
        };
        next();
    } catch {
        next(new AppError('Invalid or expired token', 401));
    }
};
