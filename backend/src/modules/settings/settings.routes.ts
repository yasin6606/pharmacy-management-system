import {Router} from 'express';
import {SettingsService} from './settings.service';
import {SettingsController} from './settings.controller';
import {authMiddleware} from '../../core/middleware/auth';
import {requireRole} from '../../core/middleware/rbac';
import container from '../../container';

const router = Router();

const service = container.resolve<SettingsService>('settingsService');
const controller = new SettingsController(service);

router.use(authMiddleware);

router.get('/franchise', controller.getFranchise);
router.put('/franchise', requireRole('manager'), controller.updateFranchise);

router.get('/integrations', requireRole('manager'), controller.listIntegrations);
router.put('/integrations', requireRole('manager'), controller.updateIntegrations);

export default router;
