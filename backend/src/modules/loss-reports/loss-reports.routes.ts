import {Router} from 'express';
import {LossReportsService} from './loss-reports.service';
import {LossReportsController} from './loss-reports.controller';
import {authMiddleware} from '../../core/middleware/auth';
import {requireRole} from '../../core/middleware/rbac';
import container from '../../container';

const router = Router();

const service = container.resolve<LossReportsService>('lossReportsService');
const controller = new LossReportsController(service);

router.use(authMiddleware);

/** Any authenticated staff can file a loss report */
router.post('/', controller.create);
router.get('/', controller.getAll);

/** Only senior / manager can approve or reject */
router.patch('/:id/review', requireRole('senior', 'manager'), controller.review);

export default router;
