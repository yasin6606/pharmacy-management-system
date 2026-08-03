import {Request, Response} from 'express';
import {BranchesService} from './branches.service';
import {asyncHandler} from '../../core/utils/asyncHandler';

export class BranchesController {
    constructor(private branchesService: BranchesService) {
    }

    create = asyncHandler(async (req: Request, res: Response) => {
        const branch = await this.branchesService.create(req.body);
        res.status(201).json({success: true, data: branch});
    });

    getAll = asyncHandler(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const result = await this.branchesService.findAllPaginated({page, limit});
        res.json({success: true, data: result});
    });

    getById = asyncHandler(async (req: Request, res: Response) => {
        const branch = await this.branchesService.findById(req.params.id);
        res.json({success: true, data: branch});
    });

    update = asyncHandler(async (req: Request, res: Response) => {
        const branch = await this.branchesService.update(req.params.id, req.body);
        res.json({success: true, data: branch});
    });

    delete = asyncHandler(async (req: Request, res: Response) => {
        await this.branchesService.delete(req.params.id);
        res.json({success: true, message: 'Branch deleted'});
    });

    toggleFranchise = asyncHandler(async (req: Request, res: Response) => {
        const branch = await this.branchesService.toggleFranchise(req.params.id);
        res.json({ success: true, data: branch });
    });
}
