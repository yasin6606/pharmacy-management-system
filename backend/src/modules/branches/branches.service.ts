import {AppDataSource} from '../../core/config/database';
import {Branch} from './entities/Branch';
import {AppError} from '../../core/errors/AppError';
import {paginate} from '../../core/utils/pagination';

export class BranchesService {
    private repo = AppDataSource.getRepository(Branch);

    async create(data: Partial<Branch>) {
        const branch = this.repo.create(data);
        return this.repo.save(branch);
    }

    /** Original unpaginated method kept for internal use or backward compatibility */
    async findAll() {
        return this.repo.find();
    }

    /** Paginated method for the list endpoint */
    async findAllPaginated(paginationOptions: { page?: number; limit?: number }) {
        const query = this.repo.createQueryBuilder('branch');
        return paginate(query, paginationOptions);
    }

    async findById(id: string) {
        return this.repo.findOneBy({id});
    }

    async update(id: string, data: Partial<Branch>) {
        const branch = await this.findById(id);
        if (!branch) throw new AppError('Branch not found', 404);
        Object.assign(branch, data);
        return this.repo.save(branch);
    }

    async delete(id: string) {
        const result = await this.repo.delete(id);
        if (result.affected === 0) throw new AppError('Branch not found', 404);
    }

    async getWarehouse() {
        return this.repo.findOne({where: {isWarehouse: true}});
    }

    async toggleFranchise(branchId: string) {
        const branch = await this.findById(branchId);
        if (!branch) throw new AppError('Branch not found', 404);
        branch.hasFranchise = !branch.hasFranchise;
        return this.repo.save(branch);
    }
}
