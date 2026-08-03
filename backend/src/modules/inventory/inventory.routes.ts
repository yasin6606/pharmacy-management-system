import { Router } from 'express';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { authMiddleware } from '../../core/middleware/auth';
import { requireRole } from '../../core/middleware/rbac';

const router = Router();
const service = new InventoryService();
const controller = new InventoryController(service);

router.use(authMiddleware);

router.get('/drugs', controller.getAllDrugs);
router.post('/drugs', requireRole('manager', 'senior'), controller.createDrug);
router.get('/drugs/:id', controller.getDrugById);
router.put('/drugs/:id', requireRole('manager', 'senior'), controller.updateDrug);

router.post('/batches', requireRole('manager', 'senior'), controller.addBatch);
router.get('/branches/:branchId/inventory', controller.getBranchInventory);
router.post('/transfer', requireRole('manager', 'senior'), controller.transferStock);

export default router;
