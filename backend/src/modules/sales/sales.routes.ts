import {Router} from 'express';
import {SalesService} from './sales.service';
import {SalesController} from './sales.controller';
import {authMiddleware} from '../../core/middleware/auth';
import {requireRole} from '../../core/middleware/rbac';

const router = Router();
const service = new SalesService();
const controller = new SalesController(service);

router.use(authMiddleware);

router.get('/', requireRole('manager', 'accountant', 'senior', 'junior'), controller.getSales);
router.post('/batch', requireRole('junior', 'senior', 'manager', 'accountant'), controller.batchSale);
router.patch('/basket/:basketId/pay', requireRole('manager', 'accountant'), controller.markBasketPaid);

export default router;
