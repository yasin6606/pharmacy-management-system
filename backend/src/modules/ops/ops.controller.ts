import {Request, Response, NextFunction} from 'express';
import {OpsService} from './ops.service';

export class OpsController {
    constructor(private service: OpsService) {}

    // Shifts
    openShift = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const branchId = req.body.branchId || (req as any).user?.branchId;
            const data = await this.service.openShift(
                branchId,
                (req as any).user.userId,
                Number(req.body.openingFloat) || 0
            );
            res.status(201).json({success: true, data});
        } catch (e) {
            next(e);
        }
    };

    closeShift = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.service.closeShift(
                req.params.id,
                (req as any).user.userId,
                Number(req.body.closingCashCounted),
                req.body.notes
            );
            res.json({success: true, data});
        } catch (e) {
            next(e);
        }
    };

    currentShift = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const branchId = (req.query.branchId as string) || (req as any).user?.branchId;
            const data = await this.service.currentShift(branchId);
            res.json({success: true, data});
        } catch (e) {
            next(e);
        }
    };

    listShifts = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const branchId = (req.query.branchId as string) || (req as any).user?.branchId;
            const data = await this.service.listShifts(
                branchId,
                Number(req.query.page) || 1,
                Number(req.query.limit) || 20
            );
            res.json({success: true, data});
        } catch (e) {
            next(e);
        }
    };

    // Audit
    listAudit = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.service.listAudit(
                Number(req.query.page) || 1,
                Number(req.query.limit) || 50,
                req.query.action as string | undefined
            );
            res.json({success: true, data});
        } catch (e) {
            next(e);
        }
    };

    // Invoice
    nextInvoice = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const branchId = req.body.branchId || (req as any).user?.branchId;
            const data = await this.service.nextInvoiceNumber(branchId);
            res.json({success: true, data});
        } catch (e) {
            next(e);
        }
    };

    // Clinical
    checkInteractions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const drugIds: string[] = req.body.drugIds || [];
            const data = await this.service.checkInteractions(drugIds);
            res.json({success: true, data});
        } catch (e) {
            next(e);
        }
    };

    upsertInteraction = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.service.upsertInteraction(req.body);
            res.status(201).json({success: true, data});
        } catch (e) {
            next(e);
        }
    };

    // Prescriptions
    createPrescription = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.service.createPrescription({
                ...req.body,
                branchId: req.body.branchId || (req as any).user?.branchId,
                recordedById: (req as any).user.userId,
            });
            res.status(201).json({success: true, data});
        } catch (e) {
            next(e);
        }
    };

    listPrescriptions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const branchId = (req.query.branchId as string) || (req as any).user?.branchId;
            const data = await this.service.listPrescriptions(
                branchId,
                Number(req.query.page) || 1,
                Number(req.query.limit) || 20
            );
            res.json({success: true, data});
        } catch (e) {
            next(e);
        }
    };

    // Barcode
    barcodeLookup = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const branchId = (req.query.branchId as string) || (req as any).user?.branchId;
            const data = await this.service.findByBarcode(req.params.code, branchId);
            res.json({success: true, data});
        } catch (e) {
            next(e);
        }
    };

    // Alerts
    stockAlerts = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const branchId = (req.query.branchId as string) || (req as any).user?.branchId;
            const data = await this.service.stockAlerts(branchId, Number(req.query.days) || 30);
            res.json({success: true, data});
        } catch (e) {
            next(e);
        }
    };

    reorderSuggestions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const branchId = (req.query.branchId as string) || (req as any).user?.branchId;
            const data = await this.service.reorderSuggestions(branchId);
            res.json({success: true, data});
        } catch (e) {
            next(e);
        }
    };

    // SMS
    creditReminder = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.service.remindCredit(
                req.body.phone,
                req.body.customerName || 'مشتری',
                Number(req.body.amountIrr) || 0
            );
            res.status(201).json({success: true, data});
        } catch (e) {
            next(e);
        }
    };

    // Goods receipt
    receiveGoods = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.service.receiveGoods({
                ...req.body,
                branchId: req.body.branchId || (req as any).user?.branchId,
                receivedById: (req as any).user.userId,
            });
            res.status(201).json({success: true, data});
        } catch (e) {
            next(e);
        }
    };

    // Controlled
    listControlled = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const branchId = (req.query.branchId as string) || (req as any).user?.branchId;
            const data = await this.service.listControlledLogs(
                branchId,
                Number(req.query.page) || 1,
                Number(req.query.limit) || 50
            );
            res.json({success: true, data});
        } catch (e) {
            next(e);
        }
    };

    logControlled = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.service.logControlledDispense({
                ...req.body,
                branchId: req.body.branchId || (req as any).user?.branchId,
                dispensedById: (req as any).user.userId,
            });
            res.status(201).json({success: true, data});
        } catch (e) {
            next(e);
        }
    };

    // Accounting
    accountingExport = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const branchId = (req.query.branchId as string) || (req as any).user?.branchId;
            const from = new Date(String(req.query.from || Date.now() - 30 * 864e5));
            const to = new Date(String(req.query.to || Date.now()));
            const data = await this.service.accountingExport(branchId, from, to);
            res.json({success: true, data});
        } catch (e) {
            next(e);
        }
    };

    backupInfo = async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.service.backupInfo();
            res.json({success: true, data});
        } catch (e) {
            next(e);
        }
    };
}
