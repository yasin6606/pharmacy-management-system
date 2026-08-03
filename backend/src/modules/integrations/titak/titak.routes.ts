import { Router } from 'express';
import { TitakService } from './titak.service';
import { TitakController } from './titak.controller';
import { authMiddleware } from '../../../core/middleware/auth';

const router = Router();
const service = new TitakService();
const controller = new TitakController(service);

router.use(authMiddleware);
router.post('/update-price/:drugId', controller.updatePrice);

export default router;
