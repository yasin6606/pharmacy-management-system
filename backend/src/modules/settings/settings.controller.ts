import {Request, Response} from 'express';
import {SettingsService} from './settings.service';
import {asyncHandler} from '../../core/utils/asyncHandler';

export class SettingsController {
    constructor(private settingsService: SettingsService) {}

    getFranchise = asyncHandler(async (req: Request, res: Response) => {
        const amount = await this.settingsService.getFranchiseAmount();
        res.json({success: true, data: {franchiseAmount: amount}});
    });

    updateFranchise = asyncHandler(async (req: Request, res: Response) => {
        const {amount} = req.body;
        if (typeof amount !== 'number' || amount < 0) {
            return res.status(400).json({success: false, message: 'Invalid amount'});
        }
        const result = await this.settingsService.setFranchiseAmount(amount);
        res.json({success: true, data: {franchiseAmount: Number(result.value)}});
    });

    listIntegrations = asyncHandler(async (req: Request, res: Response) => {
        const data = await this.settingsService.listIntegrationsMasked();
        res.json({success: true, data});
    });

    updateIntegrations = asyncHandler(async (req: Request, res: Response) => {
        const {entries} = req.body as {entries?: {key: string; value: string}[]};
        if (!Array.isArray(entries)) {
            return res.status(400).json({success: false, message: 'entries array required'});
        }
        const data = await this.settingsService.upsertIntegrations(entries);
        res.json({success: true, data});
    });
}
