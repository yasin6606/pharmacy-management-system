import {AppDataSource} from '../../core/config/database';
import {Employee, EmployeeRole} from '../employees/entities/Employee';
import bcrypt from 'bcryptjs';
import {AppError} from '../../core/errors/AppError';
import {BCRYPT_ROUNDS} from '../../core/utils/passwordPolicy';

export class SetupService {
    async createFirstManager(data: {email: string; password: string; fullName: string}) {
        return AppDataSource.transaction(async (manager) => {
            const count = await manager.getRepository(Employee).count();
            if (count > 0) {
                throw new AppError('Setup already completed', 400);
            }

            const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
            const managerEntity = manager.getRepository(Employee).create({
                email: data.email.trim().toLowerCase(),
                passwordHash,
                fullName: data.fullName.trim(),
                role: EmployeeRole.MANAGER,
                isActive: true,
            });
            const saved = await manager.getRepository(Employee).save(managerEntity);
            return {id: saved.id, email: saved.email};
        });
    }
}
