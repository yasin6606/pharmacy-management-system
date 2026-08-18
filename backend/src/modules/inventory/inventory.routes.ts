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

const managers = requireRole('manager', 'senior');

// ---- Catalog overview (before :id routes) ----
router.get('/catalog/stats', controller.getCatalogStats);
router.get('/batches/expiring', controller.getExpiring);

// ---- Drugs catalog ----
router.get('/drugs', controller.getAllDrugs);
router.post('/drugs', managers, controller.createDrug);
router.get('/drugs/:id', controller.getDrugById);
router.put('/drugs/:id', managers, controller.updateDrug);
router.delete('/drugs/:id', requireRole('manager'), controller.deleteDrug);

// ---- Batches & stock movements ----
router.post('/batches', managers, controller.addBatch);
router.put('/batches/:id', managers, controller.updateBatch);
router.get('/branches/:branchId/inventory', controller.getBranchInventory);
router.post('/transfer', managers, controller.transferStock);

export default router;
