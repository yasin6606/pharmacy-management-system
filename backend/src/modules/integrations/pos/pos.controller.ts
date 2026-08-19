import {Request, Response} from 'express';
import {PosService} from './pos.service';
import {asyncHandler} from '../../../core/utils/asyncHandler';

export class PosController {
    constructor(private posService: PosService) {}

    initiate = asyncHandler(async (req: Request, res: Response) => {
        const amount = Number(req.body?.amount);
        const terminalId = req.body?.terminalId as string | undefined;
        const data = await this.posService.initiate(amount, terminalId);
        res.status(201).json({success: true, data});
    });

    confirm = asyncHandler(async (req: Request, res: Response) => {
        const referenceCode = String(req.body?.referenceCode || '');
        const approved = req.body?.approved !== false;
        const data = await this.posService.confirm(referenceCode, approved);
        res.json({success: data.success, data});
    });

    status = asyncHandler(async (req: Request, res: Response) => {
        const data = await this.posService.getStatus(String(req.params.referenceCode || ''));
        res.json({success: true, data});
    });
}
