import {Router} from 'express';
import {OpsService} from './ops.service';
import {OpsController} from './ops.controller';
import {authMiddleware} from '../../core/middleware/auth';
import {requireRole} from '../../core/middleware/rbac';

const router = Router();
const controller = new OpsController(new OpsService());

router.use(authMiddleware);

const staff = requireRole('junior', 'senior', 'manager', 'accountant');
const seniorPlus = requireRole('senior', 'manager', 'accountant');
const managerPlus = requireRole('manager', 'accountant');
const managerOnly = requireRole('manager');

// Shifts — any on-duty staff
router.post('/shifts/open', staff, controller.openShift);
router.post('/shifts/:id/close', staff, controller.closeShift);
router.get('/shifts/current', staff, controller.currentShift);
router.get('/shifts', seniorPlus, controller.listShifts);

// Audit (manager+)
router.get('/audit', managerPlus, controller.listAudit);

// Official invoice number
router.post('/invoices/next', staff, controller.nextInvoice);

// Clinical
router.post('/clinical/interactions/check', staff, controller.checkInteractions);
router.post('/clinical/interactions', seniorPlus, controller.upsertInteraction);

// Prescriptions
router.post('/prescriptions', staff, controller.createPrescription);
router.get('/prescriptions', staff, controller.listPrescriptions);

// Barcode lookup at POS
router.get('/barcode/:code', staff, controller.barcodeLookup);

// Alerts & reorder
router.get('/alerts/stock', staff, controller.stockAlerts);
router.get('/reorder-suggestions', seniorPlus, controller.reorderSuggestions);

// Notifications
router.post('/notifications/credit-reminder', managerPlus, controller.creditReminder);

// Purchasing goods receipt
router.post('/goods-receipts', seniorPlus, controller.receiveGoods);

// Controlled drugs — write requires senior+; list manager+/senior
router.get('/controlled-logs', seniorPlus, controller.listControlled);
router.post('/controlled-logs', seniorPlus, controller.logControlled);

// Accounting export
router.get('/accounting/export', managerPlus, controller.accountingExport);

// Backup guidance
router.get('/backup-info', managerOnly, controller.backupInfo);

export default router;
