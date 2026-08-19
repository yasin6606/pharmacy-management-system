import {Router} from 'express';
import {OpsService} from './ops.service';
import {OpsController} from './ops.controller';
import {authMiddleware} from '../../core/middleware/auth';
import {requireRole} from '../../core/middleware/rbac';

const router = Router();
const controller = new OpsController(new OpsService());

router.use(authMiddleware);

// Shifts
router.post('/shifts/open', controller.openShift);
router.post('/shifts/:id/close', controller.closeShift);
router.get('/shifts/current', controller.currentShift);
router.get('/shifts', controller.listShifts);

// Audit (manager+)
router.get('/audit', requireRole('manager', 'accountant'), controller.listAudit);

// Official invoice number
router.post('/invoices/next', controller.nextInvoice);

// Clinical
router.post('/clinical/interactions/check', controller.checkInteractions);
router.post(
    '/clinical/interactions',
    requireRole('manager', 'senior'),
    controller.upsertInteraction
);

// Prescriptions
router.post('/prescriptions', controller.createPrescription);
router.get('/prescriptions', controller.listPrescriptions);

// Barcode
router.get('/barcode/:code', controller.barcodeLookup);

// Alerts & reorder
router.get('/alerts/stock', controller.stockAlerts);
router.get('/reorder-suggestions', controller.reorderSuggestions);

// Notifications
router.post('/notifications/credit-reminder', controller.creditReminder);

// Purchasing goods receipt
router.post('/goods-receipts', requireRole('manager', 'senior'), controller.receiveGoods);

// Controlled drugs
router.get('/controlled-logs', requireRole('manager', 'senior', 'pharmacist' as any), controller.listControlled);
router.post('/controlled-logs', controller.logControlled);

// Accounting export
router.get(
    '/accounting/export',
    requireRole('manager', 'accountant'),
    controller.accountingExport
);

// Backup guidance
router.get('/backup-info', requireRole('manager'), controller.backupInfo);

export default router;
