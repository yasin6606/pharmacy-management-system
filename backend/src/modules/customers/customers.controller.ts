import {Request, Response, NextFunction} from 'express';
import {CustomersService} from './customers.service';

export class CustomersController {
    constructor(private service: CustomersService) {}

    list = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;
            const search = req.query.search as string | undefined;
            const data = await this.service.list(page, limit, search);
            res.json({success: true, data});
        } catch (e) {
            next(e);
        }
    };

    get = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.service.get(req.params.id);
            res.json({success: true, data});
        } catch (e) {
            next(e);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.service.create(req.body);
            res.status(201).json({success: true, data});
        } catch (e) {
            next(e);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.service.update(req.params.id, req.body);
            res.json({success: true, data});
        } catch (e) {
            next(e);
        }
    };
}
