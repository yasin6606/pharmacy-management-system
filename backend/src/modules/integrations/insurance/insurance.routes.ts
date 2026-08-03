import { Router } from 'express';
import { InsuranceService } from './insurance.service';
import { InsuranceController } from './insurance.controller';
import { authMiddleware } from '../../../core/middleware/auth';

const router = Router();
const service = new InsuranceService();
const controller = new InsuranceController(service);

router.use(authMiddleware);
router.post('/validate', controller.validate);
router.post('/submit', controller.submit);

export default router;
