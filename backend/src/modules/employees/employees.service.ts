import {AppDataSource} from '../../core/config/database';
import {Employee, EmployeeRole} from './entities/Employee';
import {EmployeeBranchHistory} from './entities/EmployeeBranchHistory';
import {Branch} from '../branches/entities/Branch';
import {AppError} from '../../core/errors/AppError';
import {paginate} from '../../core/utils/pagination';
import bcrypt from 'bcryptjs';
import {EmployeeSession} from '../auth/entities/EmployeeSession';
import {BCRYPT_ROUNDS} from '../../core/utils/passwordPolicy';

/** Remove passwordHash from any employee payload */
function sanitizeEmployee<T extends Partial<Employee> | null>(employee: T): T {
    if (!employee) return employee;
    const {passwordHash, ...safe} = employee as any;
    return safe as T;
}

function sanitizeEmployees(employees: Employee[]) {
    return employees.map((e) => sanitizeEmployee(e));
}

export class EmployeesService {
    private employeeRepo = AppDataSource.getRepository(Employee);
    private branchRepo = AppDataSource.getRepository(Branch);
    private historyRepo = AppDataSource.getRepository(EmployeeBranchHistory);
    private sessionRepo = AppDataSource.getRepository(EmployeeSession);

    private async invalidateSessions(employeeId: string) {
        await this.sessionRepo
            .createQueryBuilder()
            .update(EmployeeSession)
            .set({logoutTime: new Date()})
            .where('employee_id = :employeeId', {employeeId})
            .andWhere('logout_time IS NULL')
            .execute();
    }

    async create(data: Partial<Employee> & {password?: string}) {
        if (data.email) data.email = data.email.trim().toLowerCase();
        const existing = await this.employeeRepo.findOne({where: {email: data.email}});
        if (existing) throw new AppError('Email already in use', 400);

        if (data.password) {
            data.passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
            delete (data as any).password;
        }

        if (!data.passwordHash) {
            throw new AppError('Password is required', 400);
        }

        const employee = this.employeeRepo.create(data);
        const saved = await this.employeeRepo.save(employee);
        return sanitizeEmployee(saved);
    }

    async findAll() {
        const employees = await this.employeeRepo.find({relations: ['currentBranch']});
        return sanitizeEmployees(employees);
    }

    async findById(id: string) {
        const employee = await this.employeeRepo.findOne({
            where: {id},
            relations: ['currentBranch'],
        });
        if (!employee) throw new AppError('Employee not found', 404);
        return sanitizeEmployee(employee);
    }

    async findAllPaginated(pagination: {page?: number; limit?: number}) {
        const query = this.employeeRepo
            .createQueryBuilder('employee')
            .leftJoinAndSelect('employee.currentBranch', 'branch');

        const result = await paginate(query, pagination);
        return {
            ...result,
            items: sanitizeEmployees(result.items),
        };
    }

    async update(id: string, data: Partial<Employee> & {password?: string; isActive?: boolean}) {
        const employee = await this.employeeRepo.findOne({
            where: {id},
            relations: ['currentBranch'],
        });
        if (!employee) throw new AppError('Employee not found', 404);

        delete (data as any).passwordHash;

        const prevRole = employee.role;
        let mustInvalidate = false;

        if (data.password) {
            employee.passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
            delete (data as any).password;
            mustInvalidate = true;
        }

        if (data.currentBranchId !== undefined) {
            employee.currentBranch = null as any;
        }

        Object.assign(employee, data);

        if (data.role !== undefined && data.role !== prevRole) {
            mustInvalidate = true;
        }
        if (data.isActive === false) {
            mustInvalidate = true;
        }

        const saved = await this.employeeRepo.save(employee);
        if (mustInvalidate) {
            await this.invalidateSessions(id);
        }
        return sanitizeEmployee(saved);
    }

    async delete(id: string) {
        await this.invalidateSessions(id);
        const result = await this.employeeRepo.delete(id);
        if (result.affected === 0) throw new AppError('Employee not found', 404);
    }

    async changeBranch(employeeId: string, newBranchId: string) {
        const employee = await this.employeeRepo.findOne({
            where: {id: employeeId},
            relations: ['currentBranch'],
        });
        if (!employee) throw new AppError('Employee not found', 404);

        const branch = await this.branchRepo.findOneBy({id: newBranchId});
        if (!branch) throw new AppError('Branch not found', 404);

        if (employee.currentBranchId) {
            await this.historyRepo.save({
                employeeId,
                branchId: employee.currentBranchId,
            });
        }

        employee.currentBranchId = newBranchId;
        employee.currentBranch = null as any;
        const saved = await this.employeeRepo.save(employee);
        return sanitizeEmployee(saved);
    }

    async getSessions(employeeId: string) {
        return this.sessionRepo.find({
            where: {employeeId},
            order: {loginTime: 'DESC'},
        });
    }
}
