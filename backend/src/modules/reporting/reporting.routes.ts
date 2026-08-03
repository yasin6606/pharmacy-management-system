import { Router } from 'express';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';
import { authMiddleware } from '../../core/middleware/auth';
import { requireRole } from '../../core/middleware/rbac';

const router = Router();
const service = new ReportingService();
const controller = new ReportingController(service);

router.use(authMiddleware);
router.get('/sales', requireRole('manager', 'accountant'), controller.getSalesReport);

export default router;
