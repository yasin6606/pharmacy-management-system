import {Router} from 'express';
import {BranchesService} from './branches.service';
import {BranchesController} from './branches.controller';
import {authMiddleware} from '../../core/middleware/auth';
import {requireRole} from '../../core/middleware/rbac';

const router = Router();
const service = new BranchesService();
const controller = new BranchesController(service);

router.use(authMiddleware);

router.get('/', requireRole('manager', 'accountant'), controller.getAll);
router.post('/', requireRole('manager'), controller.create);
router.get('/:id', requireRole('manager', 'accountant'), controller.getById);
router.put('/:id', requireRole('manager'), controller.update);
router.delete('/:id', requireRole('manager'), controller.delete);
router.patch('/:id/franchise', requireRole('manager'), controller.toggleFranchise);

export default router;
