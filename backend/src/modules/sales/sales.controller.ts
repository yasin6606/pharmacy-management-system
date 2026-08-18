import {Request, Response} from 'express';
import {SalesService} from './sales.service';
import {asyncHandler} from '../../core/utils/asyncHandler';

export class SalesController {
    constructor(private salesService: SalesService) {}

    batchSale = asyncHandler(async (req: Request, res: Response) => {
        const {items, payment} = req.body;

        const result: any = await this.salesService.recordBatchSale(
            items,
            req.user.userId,
            req.user.branchId,
            payment || {method: 'cash'}
        );

        res.status(201).json({success: true, data: result, message: 'Batch sale completed'});
    });

    private buildFilters(req: Request) {
        const {branchId, employeeId, startDate, endDate, paymentMethod, search} = req.query;
        const role = req.user.role;
        const filters: Record<string, string> = {};

        if (startDate) filters.startDate = startDate as string;
        if (endDate) filters.endDate = endDate as string;
        if (paymentMethod) filters.paymentMethod = paymentMethod as string;
        if (search) filters.search = search as string;

        if (role === 'manager' || role === 'accountant') {
            if (branchId) filters.branchId = branchId as string;
            if (employeeId) filters.employeeId = employeeId as string;
        } else {
            filters.employeeId = req.user.userId;
            if (req.user.branchId) filters.branchId = req.user.branchId;
        }

        return filters;
    }

    getSales = asyncHandler(async (req: Request, res: Response) => {
        const {page, limit} = req.query;
        const filters = this.buildFilters(req);

        const result = await this.salesService.getSalesPaginated(filters, {
            page: parseInt(page as string) || 1,
            limit: parseInt(limit as string) || 10,
        });
        res.json({success: true, data: result});
    });

    getSalesSummary = asyncHandler(async (req: Request, res: Response) => {
        const filters = this.buildFilters(req);
        const summary = await this.salesService.getSalesSummary(filters);
        res.json({success: true, data: summary});
    });

    markBasketPaid = asyncHandler(async (req: Request, res: Response) => {
        const {basketId} = req.params;
        await this.salesService.markBasketAsPaid(basketId, req.user.branchId);
        res.json({success: true, message: 'Credit marked as paid'});
    });
}
