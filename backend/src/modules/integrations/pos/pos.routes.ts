import {Router} from 'express';
import {PosService} from './pos.service';
import {PosController} from './pos.controller';
import {authMiddleware} from '../../../core/middleware/auth';

const router = Router();
const service = new PosService();
const controller = new PosController(service);

router.use(authMiddleware);

router.post('/initiate', controller.initiate);
router.post('/confirm', controller.confirm);
router.get('/status/:referenceCode', controller.status);

export default router;
