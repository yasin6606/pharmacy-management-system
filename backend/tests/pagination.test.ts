import {paginate} from '../src/core/utils/pagination';

describe('paginate', () => {
    function mockQuery(items: any[], total: number) {
        return {
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn().mockResolvedValue([items, total]),
        } as any;
    }

    it('returns paginated shape with defaults', async () => {
        const qb = mockQuery([{id: 1}], 25);
        const result = await paginate(qb, {});
        expect(result).toEqual({
            items: [{id: 1}],
            total: 25,
            page: 1,
            limit: 10,
            totalPages: 3,
        });
        expect(qb.skip).toHaveBeenCalledWith(0);
        expect(qb.take).toHaveBeenCalledWith(10);
    });

    it('clamps page and limit', async () => {
        const qb = mockQuery([], 0);
        const result = await paginate(qb, {page: 0, limit: 500});
        expect(result.page).toBe(1);
        expect(result.limit).toBe(100);
        expect(qb.skip).toHaveBeenCalledWith(0);
        expect(qb.take).toHaveBeenCalledWith(100);
    });

    it('computes skip for page 3', async () => {
        const qb = mockQuery([], 50);
        await paginate(qb, {page: 3, limit: 10});
        expect(qb.skip).toHaveBeenCalledWith(20);
    });
});
