import {Router} from 'express';
import {SettingsService} from './settings.service';
import {SettingsController} from './settings.controller';
import {authMiddleware} from '../../core/middleware/auth';
import {requireRole} from '../../core/middleware/rbac';

const router = Router();
const service = new SettingsService();
const controller = new SettingsController(service);

router.use(authMiddleware);
router.get('/franchise', controller.getFranchise);
router.put('/franchise', requireRole('manager'), controller.updateFranchise);

export default router;
