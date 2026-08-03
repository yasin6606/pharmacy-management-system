import {Request, Response} from 'express';
import {PurchasingService} from './purchasing.service';
import {asyncHandler} from '../../core/utils/asyncHandler';
import multer from 'multer';

const upload = multer({storage: multer.memoryStorage()});

export class PurchasingController {
    constructor(private purchasingService: PurchasingService) {
    }

    createOrder = asyncHandler(async (req: Request, res: Response) => {
        const order = await this.purchasingService.createOrder({
            ...req.body,
            createdById: req.user!.userId,    // from auth middleware
        });
        res.status(201).json({success: true, data: order});
    });

    // Use the multer middleware as an array (like you already did in the routes)
    uploadInvoice = [
        upload.single('invoice'),
        asyncHandler(async (req: Request, res: Response) => {
            // TypeScript now knows req.file because of multer's type extension
            const preview = await this.purchasingService.processInvoiceImage(
                req.file!.buffer
            );
            res.json({success: true, data: preview});
        }),
    ];
}
