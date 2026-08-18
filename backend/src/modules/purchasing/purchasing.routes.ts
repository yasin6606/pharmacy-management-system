import {Router} from 'express';
import {PurchasingService} from './purchasing.service';
import {PurchasingController} from './purchasing.controller';
import {authMiddleware} from '../../core/middleware/auth';
import {requireRole} from '../../core/middleware/rbac';
import container from '../../container';

const router = Router();

const service = container.resolve<PurchasingService>('purchasingService');
const controller = new PurchasingController(service);

router.use(authMiddleware);

/** Create a purchase order against a supplier */
router.post('/orders', requireRole('manager', 'senior'), controller.createOrder);
/** Upload supplier invoice image for OCR extraction */
router.post('/ocr/invoice', requireRole('manager', 'senior'), controller.uploadInvoice);

export default router;
