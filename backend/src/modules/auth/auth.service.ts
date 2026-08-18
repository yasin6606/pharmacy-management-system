import {AppDataSource} from '../../core/config/database';
import {Employee} from '../employees/entities/Employee';
import {EmployeeSession} from './entities/EmployeeSession';
import bcrypt from 'bcryptjs';
import {signToken} from '../../core/utils/jwt';
import {AppError} from '../../core/errors/AppError';

/**
 * Strip sensitive fields before any employee object leaves the service layer.
 * passwordHash must never reach the client or logs.
 */
function sanitizeEmployee(employee: Employee | null) {
    if (!employee) return null;
    const {passwordHash, ...safe} = employee as Employee & {passwordHash?: string};
    return safe;
}

/**
 * Authentication & session lifecycle.
 *
 * - login: verify credentials, open a session row, issue JWT
 * - logout: close the session (best-effort)
 * - getProfile: return the current user without secrets
 */
export class AuthService {
    private employeeRepo = AppDataSource.getRepository(Employee);
    private sessionRepo = AppDataSource.getRepository(EmployeeSession);

    async login(email: string, password: string, ipAddress: string) {
        const employee = await this.employeeRepo.findOne({
            where: {email},
            relations: ['currentBranch'],
        });

        // Constant-ish failure message to avoid user-enumeration side channels
        if (!employee || !(await bcrypt.compare(password, employee.passwordHash))) {
            throw new AppError('Invalid credentials', 401);
        }

        const session = this.sessionRepo.create({
            employeeId: employee.id,
            ipAddress,
        });
        await this.sessionRepo.save(session);

        // JWT carries identity + session so logout can invalidate by sessionId
        const token = signToken({
            userId: employee.id,
            role: employee.role,
            branchId: employee.currentBranchId,
            sessionId: session.id,
        });

        return {
            token,
            employee: sanitizeEmployee(employee),
        };
    }

    async logout(sessionId: string) {
        if (!sessionId) {
            throw new AppError('Session not found', 400);
        }
        await this.sessionRepo.update(sessionId, {logoutTime: new Date()});
    }

    async getProfile(userId: string) {
        const employee = await this.employeeRepo.findOne({
            where: {id: userId},
            relations: ['currentBranch'],
        });
        if (!employee) {
            throw new AppError('User not found', 404);
        }
        return sanitizeEmployee(employee);
    }
}
