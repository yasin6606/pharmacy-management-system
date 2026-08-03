import {Request, Response} from 'express';
import {SalesService} from './sales.service';
import {asyncHandler} from '../../core/utils/asyncHandler';

export class SalesController {
    constructor(private salesService: SalesService) {
    }

    batchSale = asyncHandler(async (req: Request, res: Response) => {
        const {items, payment} = req.body;

        const result: boolean = await this.salesService.recordBatchSale(
            items,
            req.user.userId,
            req.user.branchId,
            payment || {method: 'cash'}
        );

        res.status(201).json({success: true, data: result, message: 'Batch sale completed'});
    });

    getSales = asyncHandler(async (req: Request, res: Response) => {
        const {page, limit, branchId, employeeId, startDate, endDate, paymentMethod} = req.query;
        const role = req.user.role;

        // Build filters
        const filters: any = {};

        // Apply date filters if provided
        if (startDate) filters.startDate = startDate as string;
        if (endDate) filters.endDate = endDate as string;

        // For managers and accountants: respect optional branch / employee filters
        if (role === 'manager' || role === 'accountant') {
            if (branchId) filters.branchId = branchId as string;
            if (employeeId) filters.employeeId = employeeId as string;
        } else {
            // Juniors and seniors can only see their own sales
            filters.employeeId = req.user.userId;
            // Optionally, you could also restrict to their current branch
            filters.branchId = req.user.branchId;
        }

        if (paymentMethod) filters.paymentMethod = paymentMethod as string;

        const result = await this.salesService.getSalesPaginated(filters, {
            page: parseInt(page as string) || 1,
            limit: parseInt(limit as string) || 10,
        });
        res.json({success: true, data: result});
    });

    markBasketPaid = asyncHandler(async (req: Request, res: Response) => {
        const {basketId} = req.params;
        await this.salesService.markBasketAsPaid(basketId, req.user.branchId);
        res.json({success: true, message: 'Credit marked as paid'});
    });
}
