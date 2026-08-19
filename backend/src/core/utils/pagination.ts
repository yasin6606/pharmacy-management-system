import {SelectQueryBuilder, ObjectLiteral} from 'typeorm';

export interface PaginationOptions {
    page?: number;
    limit?: number;
}

export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/** Paginate a TypeORM SelectQueryBuilder. */
export async function paginate<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    options: PaginationOptions = {}
): Promise<PaginatedResult<T>> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;

    const [items, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0,
    };
}

/** Build a PaginatedResult from an already-fetched page (e.g. findAndCount). */
export function toPaginatedResult<T>(
    items: T[],
    total: number,
    page = 1,
    limit = 10
): PaginatedResult<T> {
    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(100, Math.max(1, limit || 10));
    return {
        items,
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit) || 0,
    };
}
