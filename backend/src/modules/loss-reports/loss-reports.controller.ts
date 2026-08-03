import {Request, Response} from 'express';
import {LossReportsService} from './loss-reports.service';
import {asyncHandler} from '../../core/utils/asyncHandler';
import {LossReportStatus} from './entities/LossReport';

export class LossReportsController {
    constructor(private lossReportsService: LossReportsService) {
    }

    create = asyncHandler(async (req: Request, res: Response) => {
        const report = await this.lossReportsService.create({
            ...req.body,
            reportedById: req.user.userId,
            branchId: req.user.branchId,
        });
        res.status(201).json({success: true, data: report});
    });

    review = asyncHandler(async (req: Request, res: Response) => {
        const {status} = req.body;
        const report = await this.lossReportsService.review(
            req.params.id,
            status,
            req.user.userId
        );
        res.json({success: true, data: report});
    });

    getAll = asyncHandler(async (req: Request, res: Response) => {
        const { branchId, status, page, limit } = req.query;

        const result = await this.lossReportsService.findAllPaginated(
            { branchId: branchId as string, status: status as any },
            { page: parseInt(page as string) || 1, limit: parseInt(limit as string) || 10 }
        );
        res.json({ success: true, data: result });
    });
}
