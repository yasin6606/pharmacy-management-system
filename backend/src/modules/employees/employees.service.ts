import {AppDataSource} from '../../core/config/database';
import {Employee, EmployeeRole} from './entities/Employee';
import {EmployeeBranchHistory} from './entities/EmployeeBranchHistory';
import {Branch} from '../branches/entities/Branch';
import {AppError} from '../../core/errors/AppError';
import {paginate} from "../../core/utils/pagination";
import bcrypt from 'bcryptjs';

export class EmployeesService {
    private employeeRepo = AppDataSource.getRepository(Employee);
    private branchRepo = AppDataSource.getRepository(Branch);
    private historyRepo = AppDataSource.getRepository(EmployeeBranchHistory);

    async create(data: Partial<Employee> & { password?: string }) {
        // 1. Check for duplicate email
        const existing = await this.employeeRepo.findOne({where: {email: data.email}});
        if (existing) throw new AppError('Email already in use', 400);

        // 2. Map password → passwordHash (if password provided)
        if (data.password) {
            data.passwordHash = await bcrypt.hash(data.password, 10);
            delete data.password; // remove plain text password before saving
        }

        // 3. Create and save
        const employee = this.employeeRepo.create(data);
        return this.employeeRepo.save(employee);
    }

    async findAll() {
        return this.employeeRepo.find({relations: ['currentBranch']});
    }

    async findById(id: string) {
        return this.employeeRepo.findOne({where: {id}, relations: ['currentBranch']});
    }

    async findAllPaginated(pagination: { page?: number; limit?: number }) {
        const query = this.employeeRepo.createQueryBuilder('employee')
            .leftJoinAndSelect('employee.currentBranch', 'branch');
        return paginate(query, pagination);
    }

    async update(id: string, data: Partial<Employee>) {
        const employee = await this.findById(id);
        if (!employee) throw new AppError('Employee not found', 404);

        // If the branch ID is being changed, clear the loaded relation
        if (data.currentBranchId !== undefined) {
            employee.currentBranch = null as any;
        }

        Object.assign(employee, data);
        return this.employeeRepo.save(employee);
    }

    async delete(id: string) {
        const result = await this.employeeRepo.delete(id);
        if (result.affected === 0) throw new AppError('Employee not found', 404);
    }

    async changeBranch(employeeId: string, newBranchId: string) {
        const employee = await this.findById(employeeId);
        if (!employee) throw new AppError('Employee not found', 404);
        const branch = await this.branchRepo.findOneBy({id: newBranchId});
        if (!branch) throw new AppError('Branch not found', 404);

        // Record history
        await this.historyRepo.save({
            employeeId,
            branchId: employee.currentBranchId,
        });
        employee.currentBranchId = newBranchId;
        return this.employeeRepo.save(employee);
    }

    async getSessions(employeeId: string) {
        return AppDataSource.getRepository('EmployeeSession').find({
            where: {employeeId},
            order: {loginTime: 'DESC'},
        });
    }
}
