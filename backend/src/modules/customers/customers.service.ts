import {Repository, ILike} from 'typeorm';
import {AppDataSource} from '../../core/config/database';
import {Customer} from './entities/Customer';
import {AppError} from '../../core/errors/AppError';
import {toPaginatedResult} from '../../core/utils/pagination';

export class CustomersService {
    private repo(): Repository<Customer> {
        return AppDataSource.getRepository(Customer);
    }

    async list(page = 1, limit = 20, search?: string) {
        const where = search
            ? [
                  {firstName: ILike(`%${search}%`)},
                  {lastName: ILike(`%${search}%`)},
                  {phone: ILike(`%${search}%`)},
                  {nationalId: ILike(`%${search}%`)},
              ]
            : {};
        const [items, total] = await this.repo().findAndCount({
            where: where as any,
            order: {updatedAt: 'DESC'},
            skip: (page - 1) * limit,
            take: limit,
        });
        return toPaginatedResult(items, total, page, limit);
    }

    async get(id: string) {
        const c = await this.repo().findOne({where: {id}});
        if (!c) throw AppError.notFound('Customer not found');
        return c;
    }

    async create(data: Partial<Customer>) {
        if (!data.firstName || !data.lastName) {
            throw AppError.badRequest('firstName and lastName are required');
        }
        const entity = this.repo().create(data);
        return this.repo().save(entity);
    }

    async update(id: string, data: Partial<Customer>) {
        const c = await this.get(id);
        Object.assign(c, data);
        return this.repo().save(c);
    }
}
