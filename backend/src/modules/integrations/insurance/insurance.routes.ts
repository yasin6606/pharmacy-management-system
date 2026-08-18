import {Router} from 'express';
import {InsuranceService} from './insurance.service';
import {InsuranceController} from './insurance.controller';
import {authMiddleware} from '../../../core/middleware/auth';
import container from '../../../container';

const router = Router();

const service = container.resolve<InsuranceService>('insuranceService');
const controller = new InsuranceController(service);

router.use(authMiddleware);

/** Validate a claim against the configured insurance adapter */
router.post('/validate', controller.validate);
/** Submit an approved claim */
router.post('/submit', controller.submit);

export default router;
