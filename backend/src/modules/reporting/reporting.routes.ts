import {Router} from 'express';
import {ReportingService} from './reporting.service';
import {ReportingController} from './reporting.controller';
import {authMiddleware} from '../../core/middleware/auth';
import {requireRole} from '../../core/middleware/rbac';
import container from '../../container';

const router = Router();

const service = container.resolve<ReportingService>('reportingService');
const controller = new ReportingController(service);

router.use(authMiddleware);

/** Sales report (CSV / PDF export supported in controller) */
router.get('/sales', requireRole('manager', 'accountant'), controller.getSalesReport);

export default router;
