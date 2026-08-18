import {Router} from 'express';
import {BranchesService} from './branches.service';
import {BranchesController} from './branches.controller';
import {authMiddleware} from '../../core/middleware/auth';
import {requireRole} from '../../core/middleware/rbac';
import container from '../../container';

const router = Router();

const service = container.resolve<BranchesService>('branchesService');
const controller = new BranchesController(service);

router.use(authMiddleware);

router.get('/', requireRole('manager', 'accountant'), controller.getAll);
router.post('/', requireRole('manager'), controller.create);
router.get('/:id', requireRole('manager', 'accountant'), controller.getById);
router.put('/:id', requireRole('manager'), controller.update);
router.delete('/:id', requireRole('manager'), controller.delete);
/** Toggle whether franchise fee applies at this branch */
router.patch('/:id/franchise', requireRole('manager'), controller.toggleFranchise);

export default router;
