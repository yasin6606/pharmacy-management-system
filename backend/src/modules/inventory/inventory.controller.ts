import {Request, Response} from 'express';
import {InventoryService} from './inventory.service';
import {asyncHandler} from '../../core/utils/asyncHandler';

export class InventoryController {
    constructor(private inventoryService: InventoryService) {}

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

    deleteDrug = asyncHandler(async (req: Request, res: Response) => {
        await this.inventoryService.deleteDrug(req.params.id);
        res.json({success: true, data: true, message: 'Drug deleted'});
    });

    addBatch = asyncHandler(async (req: Request, res: Response) => {
        const batch = await this.inventoryService.addBatch(req.body);
        res.status(201).json({success: true, data: batch});
    });

    updateBatch = asyncHandler(async (req: Request, res: Response) => {
        const batch = await this.inventoryService.updateBatch(req.params.id, req.body);
        res.json({success: true, data: batch});
    });

    getBranchInventory = asyncHandler(async (req: Request, res: Response) => {
        const batches = await this.inventoryService.getBatchesByBranch(req.params.branchId);
        res.json({success: true, data: batches});
    });

    transferStock = asyncHandler(async (req: Request, res: Response) => {
        const {batchId, toBranchId, quantity} = req.body;
        const performedById = req.user.userId;
        const result = await this.inventoryService.transferStock(
            batchId,
            toBranchId,
            quantity,
            performedById
        );
        res.json({success: true, data: result});
    });

    getAllDrugs = asyncHandler(async (req: Request, res: Response) => {
        const {page, limit, search} = req.query;
        const result = await this.inventoryService.getDrugsPaginated({
            page: parseInt(page as string) || 1,
            limit: parseInt(limit as string) || 10,
            search: (search as string) || undefined,
        });
        res.json({success: true, data: result});
    });

    getCatalogStats = asyncHandler(async (req: Request, res: Response) => {
        const stats = await this.inventoryService.getCatalogStats();
        res.json({success: true, data: stats});
    });

    getExpiring = asyncHandler(async (req: Request, res: Response) => {
        const days = parseInt(req.query.days as string) || 30;
        const batches = await this.inventoryService.getExpiringBatches(days);
        res.json({success: true, data: batches});
    });
}
