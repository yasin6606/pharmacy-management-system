import { AppDataSource } from '../../core/config/database';
import { Employee, EmployeeRole } from '../employees/entities/Employee';
import bcrypt from 'bcryptjs';
import { AppError } from '../../core/errors/AppError';

export class SetupService {
    async createFirstManager(data: { email: string; password: string; fullName: string }) {
        const employeeRepo = AppDataSource.getRepository(Employee);
        const count = await employeeRepo.count();
        if (count > 0) {
            throw new AppError('Setup already completed', 400);
        }

        const passwordHash = await bcrypt.hash(data.password, 10);
        const manager = employeeRepo.create({
            email: data.email,
            passwordHash,
            fullName: data.fullName,
            role: EmployeeRole.MANAGER,
        });
        await employeeRepo.save(manager);
        return { id: manager.id, email: manager.email };
    }
}
