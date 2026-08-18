import {Router} from 'express';
import {TitakService} from './titak.service';
import {TitakController} from './titak.controller';
import {authMiddleware} from '../../../core/middleware/auth';
import container from '../../../container';

const router = Router();

const service = container.resolve<TitakService>('titakService');
const controller = new TitakController(service);

router.use(authMiddleware);

/** Pull latest official price for a drug from Titak and update local catalog */
router.post('/update-price/:drugId', controller.updatePrice);

export default router;
