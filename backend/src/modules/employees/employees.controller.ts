import {Request, Response} from 'express';
import {EmployeesService} from './employees.service';
import {asyncHandler} from '../../core/utils/asyncHandler';

export class EmployeesController {
    constructor(private employeesService: EmployeesService) {
    }

    create = asyncHandler(async (req: Request, res: Response) => {
        const employee = await this.employeesService.create(req.body);
        res.status(201).json({success: true, data: employee});
    });

    getById = asyncHandler(async (req: Request, res: Response) => {
        const employee = await this.employeesService.findById(req.params.id);
        res.json({success: true, data: employee});
    });

    update = asyncHandler(async (req: Request, res: Response) => {
        const employee = await this.employeesService.update(req.params.id, req.body);
        res.json({success: true, data: employee});
    });

    delete = asyncHandler(async (req: Request, res: Response) => {
        await this.employeesService.delete(req.params.id);
        res.json({success: true, data: null, message: 'Employee deleted'});
    });

    changeBranch = asyncHandler(async (req: Request, res: Response) => {
        const {branchId} = req.body;
        const employee = await this.employeesService.changeBranch(req.params.id, branchId);
        res.json({success: true, data: employee});
    });

    getSessions = asyncHandler(async (req: Request, res: Response) => {
        const sessions = await this.employeesService.getSessions(req.params.id);
        res.json({success: true, data: sessions});
    });

    getAll = asyncHandler(async (req: Request, res: Response) => {
        const {page, limit} = req.query;
        const result = await this.employeesService.findAllPaginated({
            page: parseInt(page as string) || 1,
            limit: parseInt(limit as string) || 10,
        });
        res.json({success: true, data: result});
    });
}
