import {Router} from 'express';
import {CustomersService} from './customers.service';
import {CustomersController} from './customers.controller';
import {authMiddleware} from '../../core/middleware/auth';

const router = Router();
const controller = new CustomersController(new CustomersService());

router.use(authMiddleware);
router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', controller.create);
router.put('/:id', controller.update);

export default router;
