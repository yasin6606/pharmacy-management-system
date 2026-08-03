import {Request, Response} from 'express';
import {InventoryService} from './inventory.service';
import {asyncHandler} from '../../core/utils/asyncHandler';

export class InventoryController {
    constructor(private inventoryService: InventoryService) {
    }

    createDrug = asyncHandler(async (req: Request, res: Response) => {
        const drug = await this.inventoryService.createDrug(req.body);
        res.status(201).json({success: true, data: drug});
    });

    getDrugById = asyncHandler(async (req: Request, res: Response) => {
        const drug = await this.inventoryService.getDrugById(req.params.id);
        res.json({success: true, data: drug});
    });

    updateDrug = asyncHandler(async (req: Request, res: Response) => {
        const drug = await this.inventoryService.updateDrug(req.params.id, req.body);
        res.json({success: true, data: drug});
    });

    addBatch = asyncHandler(async (req: Request, res: Response) => {
        const batch = await this.inventoryService.addBatch(req.body);
        res.status(201).json({success: true, data: batch});
    });

    getBranchInventory = asyncHandler(async (req: Request, res: Response) => {
        const batches = await this.inventoryService.getBatchesByBranch(req.params.branchId);
        res.json({success: true, data: batches});
    });

    transferStock = asyncHandler(async (req: Request, res: Response) => {
        const {batchId, toBranchId, quantity} = req.body;
        const performedById = req.user.userId;
        const result = await this.inventoryService.transferStock(batchId, toBranchId, quantity, performedById);
        res.json({success: true, data: result});
    });

    getAllDrugs = asyncHandler(async (req: Request, res: Response) => {
        const { page, limit } = req.query;
        const result = await this.inventoryService.getDrugsPaginated({
            page: parseInt(page as string) || 1,
            limit: parseInt(limit as string) || 10,
        });
        res.json({ success: true, data: result });
    });
}
