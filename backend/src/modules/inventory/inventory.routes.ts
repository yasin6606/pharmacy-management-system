import {Router} from 'express';
import {InventoryService} from './inventory.service';
import {InventoryController} from './inventory.controller';
import {authMiddleware} from '../../core/middleware/auth';
import {requireRole} from '../../core/middleware/rbac';
import container from '../../container';

const router = Router();

const service = container.resolve<InventoryService>('inventoryService');
const controller = new InventoryController(service);

router.use(authMiddleware);

// ---- Drugs catalog ----
router.get('/drugs', controller.getAllDrugs);
router.post('/drugs', requireRole('manager', 'senior'), controller.createDrug);
router.get('/drugs/:id', controller.getDrugById);
router.put('/drugs/:id', requireRole('manager', 'senior'), controller.updateDrug);

// ---- Batches & stock movements ----
router.post('/batches', requireRole('manager', 'senior'), controller.addBatch);
router.get('/branches/:branchId/inventory', controller.getBranchInventory);
router.post('/transfer', requireRole('manager', 'senior'), controller.transferStock);

export default router;
