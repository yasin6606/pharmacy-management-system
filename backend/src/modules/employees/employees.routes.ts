import { Router } from 'express';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { authMiddleware } from '../../core/middleware/auth';
import { requireRole } from '../../core/middleware/rbac';
import { validate } from '../../core/middleware/validation';
import { createEmployeeSchema, updateEmployeeSchema } from './dto/employee.dto';

const router = Router();
const service = new EmployeesService();
const controller = new EmployeesController(service);

router.use(authMiddleware);

router.get('/', requireRole('manager', 'accountant'), controller.getAll);
router.post('/', requireRole('manager'), validate(createEmployeeSchema), controller.create);
router.get('/:id', requireRole('manager', 'accountant'), controller.getById);
router.put('/:id', requireRole('manager'), validate(updateEmployeeSchema), controller.update);
router.delete('/:id', requireRole('manager'), controller.delete);
router.patch('/:id/change-branch', requireRole('manager'), controller.changeBranch);
router.get('/:id/sessions', requireRole('manager', 'accountant'), controller.getSessions);

export default router;
