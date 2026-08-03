import { Router } from 'express';
import { PurchasingService } from './purchasing.service';
import { PurchasingController } from './purchasing.controller';
import { authMiddleware } from '../../core/middleware/auth';
import { requireRole } from '../../core/middleware/rbac';

const router = Router();
const service = new PurchasingService();
const controller = new PurchasingController(service);

router.use(authMiddleware);
router.post('/orders', requireRole('manager', 'senior'), controller.createOrder);
router.post('/ocr/invoice', requireRole('manager', 'senior'), controller.uploadInvoice);

export default router;
