import {NextFunction, Request, Response} from 'express';
import {IsNull} from 'typeorm';
import {verifyToken, JwtPayload} from '../utils/jwt';
import {AppError} from '../errors/AppError';
import {AppDataSource} from '../config/database';
import {EmployeeSession} from '../../modules/auth/entities/EmployeeSession';
import {Employee} from '../../modules/employees/entities/Employee';

/**
 * Authenticate via Bearer/cookie JWT, then enforce:
 * 1) active EmployeeSession (logout invalidates)
 * 2) employee still exists and isActive
 * 3) role/branch taken from DB (not trusted solely from JWT claims)
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

        const employeeRepo = AppDataSource.getRepository(Employee);
        const employee = await employeeRepo.findOne({where: {id: payload.userId}});

        if (!employee || employee.isActive === false) {
            return next(new AppError('Account disabled or not found', 401));
        }

        req.user = {
            userId: employee.id,
            role: employee.role,
            branchId: employee.currentBranchId ?? undefined,
            sessionId: payload.sessionId,
        };
        next();
    } catch {
        next(new AppError('Invalid or expired token', 401));
    }
};
