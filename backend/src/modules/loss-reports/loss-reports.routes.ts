import {Router} from 'express';
import {LossReportsService} from './loss-reports.service';
import {LossReportsController} from './loss-reports.controller';
import {authMiddleware} from '../../core/middleware/auth';
import {requireRole} from '../../core/middleware/rbac';

const router = Router();
const service = new LossReportsService();
const controller = new LossReportsController(service);

router.use(authMiddleware);

router.post('/', controller.create);
router.get('/', controller.getAll);
router.patch('/:id/review', requireRole('senior', 'manager'), controller.review);

export default router;
