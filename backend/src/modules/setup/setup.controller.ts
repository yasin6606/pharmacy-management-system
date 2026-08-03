import { Request, Response } from 'express';
import { SetupService } from './setup.service';
import { asyncHandler } from '../../core/utils/asyncHandler';

export class SetupController {
    constructor(private setupService: SetupService) {}

    setup = asyncHandler(async (req: Request, res: Response) => {
        const manager = await this.setupService.createFirstManager(req.body);
        res.status(201).json({ success: true, data: manager });
    });
}
