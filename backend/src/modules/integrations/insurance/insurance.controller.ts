import { Request, Response } from 'express';
import { InsuranceService } from './insurance.service';
import { asyncHandler } from '../../../core/utils/asyncHandler';

export class InsuranceController {
    constructor(private insuranceService: InsuranceService) {}

    validate = asyncHandler(async (req: Request, res: Response) => {
        const { provider, code } = req.body;
        const result = await this.insuranceService.validatePrescription(provider, code);
        res.json({ success: true, data: result });
    });

    submit = asyncHandler(async (req: Request, res: Response) => {
        const { provider, ...data } = req.body;
        const result = await this.insuranceService.submitClaim(provider, data);
        res.json({ success: true, data: result });
    });
}
