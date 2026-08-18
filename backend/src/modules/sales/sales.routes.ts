import {Router} from 'express';
import {SalesService} from './sales.service';
import {SalesController} from './sales.controller';
import {authMiddleware} from '../../core/middleware/auth';
import {requireRole} from '../../core/middleware/rbac';
import container from '../../container';

const router = Router();

const service = container.resolve<SalesService>('salesService');
const controller = new SalesController(service);

router.use(authMiddleware);

const ops = requireRole('manager', 'accountant', 'senior', 'junior');

/** Aggregate totals (must be registered before /:id-style routes) */
router.get('/summary', ops, controller.getSalesSummary);

/** List / filter sales */
router.get('/', ops, controller.getSales);

/** Record a multi-item basket sale */
router.post('/batch', requireRole('junior', 'senior', 'manager', 'accountant'), controller.batchSale);

/** Mark a credit basket as paid */
router.patch('/basket/:basketId/pay', requireRole('manager', 'accountant'), controller.markBasketPaid);

export default router;
