import { Request, Response } from 'express';
import { TitakService } from './titak.service';
import { asyncHandler } from '../../../core/utils/asyncHandler';

export class TitakController {
    constructor(private titakService: TitakService) {}

    updatePrice = asyncHandler(async (req: Request, res: Response) => {
        const result = await this.titakService.updatePrice(req.params.drugId);
        res.json({ success: true, data: result });
    });
}
