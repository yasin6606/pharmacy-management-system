import {Request, Response} from 'express';
import {ReportingService} from './reporting.service';
import {asyncHandler} from '../../core/utils/asyncHandler';

export class ReportingController {
    constructor(private reportingService: ReportingService) {
    }

    getSalesReport = asyncHandler(async (req: Request, res: Response) => {
        const format = req.query.format as string;

        // CSV / PDF export – no pagination
        if (format === 'csv' || format === 'pdf') {
            const data = await this.reportingService.getAggregatedSales(req.query);
            if (format === 'csv') {
                const csv = this.reportingService.generateCSV(data);
                res.header('Content-Type', 'text/csv');
                res.attachment('sales_report.csv');
                return res.send(csv);
            } else {
                const pdf = await this.reportingService.generatePDF(data);
                res.header('Content-Type', 'application/pdf');
                res.attachment('sales_report.pdf');
                return res.send(pdf);
            }
        }

        // JSON response – paginated
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const result = await this.reportingService.getAggregatedSalesPaginated(
            req.query,
            {page, limit}
        );
        res.json({success: true, data: result});
    });
}
