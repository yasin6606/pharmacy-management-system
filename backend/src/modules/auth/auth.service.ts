import {AppDataSource} from '../../core/config/database';
import {Employee} from '../employees/entities/Employee';
import {EmployeeSession} from './entities/EmployeeSession';
import bcrypt from 'bcryptjs';
import {signToken} from '../../core/utils/jwt';
import {AppError} from '../../core/errors/AppError';

/** Strip sensitive fields before returning employee to clients */
function sanitizeEmployee(employee: Employee | null) {
    if (!employee) return null;
    const {passwordHash, ...safe} = employee as Employee & {passwordHash?: string};
    return safe;
}

export class AuthService {
    private employeeRepo = AppDataSource.getRepository(Employee);
    private sessionRepo = AppDataSource.getRepository(EmployeeSession);

    async login(email: string, password: string, ipAddress: string) {
        const employee = await this.employeeRepo.findOne({
            where: {email},
            relations: ['currentBranch'],
        });

        if (!employee || !(await bcrypt.compare(password, employee.passwordHash))) {
            throw new AppError('Invalid credentials', 401);
        }

        const session = this.sessionRepo.create({
            employeeId: employee.id,
            ipAddress,
        });
        await this.sessionRepo.save(session);

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
