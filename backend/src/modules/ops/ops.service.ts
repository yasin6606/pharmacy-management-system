import {Between, In, Repository} from 'typeorm';
import {AppDataSource} from '../../core/config/database';
import {AppError} from '../../core/errors/AppError';
import {CashShift} from '../shifts/entities/CashShift';
import {AuditLog} from '../audit/entities/AuditLog';
import {InvoiceSequence} from '../invoicing/entities/InvoiceSequence';
import {DrugInteraction} from '../clinical/entities/DrugInteraction';
import {Prescription} from '../prescriptions/entities/Prescription';
import {NotificationOutbox} from '../notifications/entities/NotificationOutbox';
import {GoodsReceipt} from '../purchasing/entities/GoodsReceipt';
import {Drug} from '../inventory/entities/Drug';
import {DrugBatch} from '../inventory/entities/DrugBatch';
import {StockMovement} from '../inventory/entities/StockMovement';
import {ControlledDrugLog} from '../inventory/entities/ControlledDrugLog';
import {SaleTransaction} from '../sales/entities/SaleTransaction';
import {paginate} from '../../core/utils/pagination';
import {logger} from '../../core/logger/logger';

export class OpsService {
    private shifts(): Repository<CashShift> {
        return AppDataSource.getRepository(CashShift);
    }
    private audit(): Repository<AuditLog> {
        return AppDataSource.getRepository(AuditLog);
    }
    private invoices(): Repository<InvoiceSequence> {
        return AppDataSource.getRepository(InvoiceSequence);
    }
    private interactions(): Repository<DrugInteraction> {
        return AppDataSource.getRepository(DrugInteraction);
    }
    private prescriptions(): Repository<Prescription> {
        return AppDataSource.getRepository(Prescription);
    }
    private outbox(): Repository<NotificationOutbox> {
        return AppDataSource.getRepository(NotificationOutbox);
    }
    private receipts(): Repository<GoodsReceipt> {
        return AppDataSource.getRepository(GoodsReceipt);
    }

    // ---- Audit ----
    async writeAudit(input: {
        actorId?: string | null;
        actorEmail?: string | null;
        action: string;
        entityType?: string;
        entityId?: string;
        metadata?: Record<string, unknown>;
        ipAddress?: string;
    }) {
        const row = this.audit().create({
            actorId: input.actorId ?? null,
            actorEmail: input.actorEmail ?? null,
            action: input.action,
            entityType: input.entityType ?? null,
            entityId: input.entityId ?? null,
            metadata: input.metadata ?? null,
            ipAddress: input.ipAddress ?? null,
        });
        return this.audit().save(row);
    }

    async listAudit(page = 1, limit = 50, action?: string) {
        const where = action ? {action} : {};
        const [items, total] = await this.audit().findAndCount({
            where,
            order: {createdAt: 'DESC'},
            skip: (page - 1) * limit,
            take: limit,
        });
        return paginate(items, total, page, limit);
    }

    // ---- Shifts ----
    async openShift(branchId: string, employeeId: string, openingFloat = 0) {
        const open = await this.shifts().findOne({where: {branchId, status: 'open'}});
        if (open) throw AppError.conflict('An open shift already exists for this branch');
        const shift = this.shifts().create({
            branchId,
            openedById: employeeId,
            openingFloat: Math.round(openingFloat),
            status: 'open',
        });
        const saved = await this.shifts().save(shift);
        await this.writeAudit({
            actorId: employeeId,
            action: 'shift.open',
            entityType: 'CashShift',
            entityId: saved.id,
            metadata: {branchId, openingFloat},
        });
        return saved;
    }

    async closeShift(
        shiftId: string,
        employeeId: string,
        closingCashCounted: number,
        notes?: string
    ) {
        const shift = await this.shifts().findOne({where: {id: shiftId}});
        if (!shift) throw AppError.notFound('Shift not found');
        if (shift.status !== 'open') throw AppError.badRequest('Shift is already closed');

        const start = shift.openedAt;
        const end = new Date();
        const sales = await AppDataSource.getRepository(SaleTransaction).find({
            where: {
                branchId: shift.branchId,
                paymentMethod: 'cash',
                soldDate: Between(start, end) as any,
            },
        });
        const cashSales = sales.reduce((s, r) => s + Number(r.patientShareAmount || r.totalPrice || 0), 0);
        const expected = Math.round(Number(shift.openingFloat) + cashSales);
        const counted = Math.round(closingCashCounted);
        shift.closedAt = end;
        shift.closedById = employeeId;
        shift.closingCashCounted = counted;
        shift.expectedCash = expected;
        shift.variance = counted - expected;
        shift.notes = notes ?? null;
        shift.status = 'closed';
        const saved = await this.shifts().save(shift);
        await this.writeAudit({
            actorId: employeeId,
            action: 'shift.close',
            entityType: 'CashShift',
            entityId: saved.id,
            metadata: {expected, counted, variance: saved.variance},
        });
        return saved;
    }

    async currentShift(branchId: string) {
        return this.shifts().findOne({where: {branchId, status: 'open'}});
    }

    async listShifts(branchId: string, page = 1, limit = 20) {
        const [items, total] = await this.shifts().findAndCount({
            where: {branchId},
            order: {openedAt: 'DESC'},
            skip: (page - 1) * limit,
            take: limit,
        });
        return paginate(items, total, page, limit);
    }

    // ---- Invoice numbers ----
    async nextInvoiceNumber(branchId: string, year = new Date().getFullYear()) {
        return AppDataSource.transaction(async (manager) => {
            let seq = await manager.findOne(InvoiceSequence, {
                where: {branchId, year},
                lock: {mode: 'pessimistic_write'},
            });
            if (!seq) {
                seq = manager.create(InvoiceSequence, {
                    branchId,
                    year,
                    lastNumber: 0,
                    prefix: `INV-${year}-`,
                });
            }
            seq.lastNumber += 1;
            await manager.save(seq);
            const number = `${seq.prefix ?? ''}${String(seq.lastNumber).padStart(6, '0')}`;
            return {invoiceNumber: number, year, sequence: seq.lastNumber};
        });
    }

    // ---- Clinical interactions & allergy check ----
    async checkInteractions(drugIds: string[]) {
        const unique = [...new Set(drugIds.filter(Boolean))];
        if (unique.length < 2) return [];
        const pairs = await this.interactions().find({
            where: [{drugAId: In(unique)}, {drugBId: In(unique)}] as any,
        });
        return pairs.filter(
            (p) => unique.includes(p.drugAId) && unique.includes(p.drugBId)
        );
    }

    async upsertInteraction(data: {
        drugAId: string;
        drugBId: string;
        severity: 'mild' | 'moderate' | 'severe';
        description: string;
    }) {
        const [a, b] = [data.drugAId, data.drugBId].sort();
        let row = await this.interactions().findOne({where: {drugAId: a, drugBId: b}});
        if (!row) {
            row = this.interactions().create({
                drugAId: a,
                drugBId: b,
                severity: data.severity,
                description: data.description,
            });
        } else {
            row.severity = data.severity;
            row.description = data.description;
        }
        return this.interactions().save(row);
    }

    // ---- Prescriptions ----
    async createPrescription(input: Partial<Prescription> & {branchId: string; recordedById: string}) {
        const row = this.prescriptions().create({
            ...input,
            lines: input.lines ?? [],
        });
        return this.prescriptions().save(row);
    }

    async listPrescriptions(branchId: string, page = 1, limit = 20) {
        const [items, total] = await this.prescriptions().findAndCount({
            where: {branchId},
            order: {createdAt: 'DESC'},
            skip: (page - 1) * limit,
            take: limit,
        });
        return paginate(items, total, page, limit);
    }

    // ---- Barcode lookup ----
    async findByBarcode(barcode: string, branchId?: string) {
        const drug = await AppDataSource.getRepository(Drug).findOne({
            where: {barcode},
        });
        if (!drug) throw AppError.notFound('No drug with this barcode');
        let batches: DrugBatch[] = [];
        if (branchId) {
            batches = await AppDataSource.getRepository(DrugBatch).find({
                where: {drugId: drug.id, branchId},
                order: {expirationDate: 'ASC'},
            });
        }
        return {drug, batches};
    }

    // ---- Min stock / near expiry alerts (query) ----
    async stockAlerts(branchId: string, days = 30) {
        const batches = await AppDataSource.getRepository(DrugBatch).find({
            where: {branchId},
            relations: ['drug'],
        });
        const soon = new Date();
        soon.setDate(soon.getDate() + days);
        const lowStock = batches.filter(
            (b) => b.drug && b.count > 0 && b.count <= (b.drug.minStockLevel || 0)
        );
        const nearExpiry = batches.filter(
            (b) => b.count > 0 && new Date(b.expirationDate) <= soon
        );
        return {
            lowStock: lowStock.map((b) => ({
                batchId: b.id,
                drugId: b.drugId,
                drugName: b.drug?.name,
                count: b.count,
                minStockLevel: b.drug?.minStockLevel,
            })),
            nearExpiry: nearExpiry.map((b) => ({
                batchId: b.id,
                drugId: b.drugId,
                drugName: b.drug?.name,
                count: b.count,
                expirationDate: b.expirationDate,
            })),
        };
    }

    // ---- Notifications (SMS outbox — provider via settings later) ----
    async enqueueSms(recipient: string, body: string, purpose?: string, metadata?: Record<string, unknown>) {
        const row = this.outbox().create({
            channel: 'sms',
            recipient,
            body,
            purpose: purpose ?? null,
            metadata: metadata ?? null,
            status: 'pending',
        });
        const saved = await this.outbox().save(row);
        // Safe default: mark skipped until SMS gateway configured
        const hasGateway = process.env.SMS_GATEWAY_URL;
        if (!hasGateway) {
            saved.status = 'skipped';
            saved.errorMessage = 'SMS_GATEWAY_URL not configured — message queued as skipped';
            await this.outbox().save(saved);
            logger.info('SMS skipped (no gateway)', {id: saved.id, recipient});
        }
        return saved;
    }

    async remindCredit(phone: string, customerName: string, amountIrr: number) {
        const body = `یادآوری بدهی داروخانه: ${customerName} مبلغ ${amountIrr} ریال. لطفاً تسویه فرمایید.`;
        return this.enqueueSms(phone, body, 'credit_reminder', {amountIrr, customerName});
    }

    // ---- Goods receipt → create batches ----
    async receiveGoods(input: {
        branchId: string;
        receivedById: string;
        purchaseOrderId?: string;
        notes?: string;
        lines: Array<{
            drugId: string;
            quantity: number;
            purchasePrice: number;
            sellingPrice?: number;
            expirationDate: string;
            batchNote?: string;
        }>;
    }) {
        if (!input.lines?.length) throw AppError.badRequest('At least one receipt line required');
        return AppDataSource.transaction(async (manager) => {
            const receipt = manager.create(GoodsReceipt, {
                branchId: input.branchId,
                receivedById: input.receivedById,
                purchaseOrderId: input.purchaseOrderId ?? null,
                notes: input.notes ?? null,
                lines: input.lines,
            });
            await manager.save(receipt);

            for (const line of input.lines) {
                if (line.quantity <= 0) continue;
                const batch = manager.create(DrugBatch, {
                    drugId: line.drugId,
                    branchId: input.branchId,
                    count: line.quantity,
                    purchasePrice: Math.round(line.purchasePrice),
                    sellingPrice: Math.round(line.sellingPrice ?? line.purchasePrice),
                    expirationDate: new Date(line.expirationDate),
                    isOffer: false,
                } as any);
                const savedBatch = await manager.save(batch);
                const movement = manager.create(StockMovement, {
                    drugBatchId: savedBatch.id,
                    type: 'purchase',
                    quantity: line.quantity,
                    toBranchId: input.branchId,
                    performedById: input.receivedById,
                    note: line.batchNote || 'Goods receipt',
                } as any);
                await manager.save(movement);
            }

            await this.writeAudit({
                actorId: input.receivedById,
                action: 'purchasing.goods_receipt',
                entityType: 'GoodsReceipt',
                entityId: receipt.id,
                metadata: {lines: input.lines.length, branchId: input.branchId},
            });

            return receipt;
        });
    }

    // ---- Controlled drug log ----
    async logControlledDispense(input: {
        drugId: string;
        branchId: string;
        dispensedById: string;
        quantity: number;
        patientName?: string;
        prescriptionRef?: string;
        saleId?: string;
        notes?: string;
    }) {
        const repo = AppDataSource.getRepository(ControlledDrugLog);
        const row = repo.create({
            ...input,
            patientName: input.patientName ?? null,
            prescriptionRef: input.prescriptionRef ?? null,
            saleId: input.saleId ?? null,
            notes: input.notes ?? null,
        });
        return repo.save(row);
    }

    async listControlledLogs(branchId: string, page = 1, limit = 50) {
        const repo = AppDataSource.getRepository(ControlledDrugLog);
        const [items, total] = await repo.findAndCount({
            where: {branchId},
            order: {createdAt: 'DESC'},
            skip: (page - 1) * limit,
            take: limit,
            relations: ['drug'],
        });
        return paginate(items, total, page, limit);
    }

    // ---- Accounting export (simple CSV rows) ----
    async accountingExport(branchId: string, from: Date, to: Date) {
        const sales = await AppDataSource.getRepository(SaleTransaction).find({
            where: {branchId, soldDate: Between(from, to) as any},
            order: {soldDate: 'ASC'},
        });
        return sales.map((s) => ({
            date: s.soldDate,
            basketId: s.basketId,
            paymentMethod: s.paymentMethod,
            totalPrice: s.totalPrice,
            patientShare: s.patientShareAmount,
            insuranceCoverage: s.insuranceCoverageAmount,
            insuranceProvider: s.insuranceProvider,
            isPaid: s.isPaid,
            // Simple mapping codes for external accounting packages
            debitAccount: s.paymentMethod === 'credit' ? '1200-AR' : '1100-CASH',
            creditAccount: '4100-SALES',
        }));
    }

    // ---- Admin backup metadata (actual dump is ops responsibility) ----
    async backupInfo() {
        return {
            message:
                'Logical backup: use pg_dump on the postgres service. This endpoint only reports guidance.',
            recommendedCommand:
                'docker compose exec -T postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup.sql',
            timestamp: new Date().toISOString(),
        };
    }

    // ---- Reorder suggestions ----
    async reorderSuggestions(branchId: string) {
        const batches = await AppDataSource.getRepository(DrugBatch).find({
            where: {branchId},
            relations: ['drug'],
        });
        const byDrug = new Map<string, {drug: Drug; total: number}>();
        for (const b of batches) {
            if (!b.drug) continue;
            const cur = byDrug.get(b.drugId) || {drug: b.drug, total: 0};
            cur.total += b.count;
            byDrug.set(b.drugId, cur);
        }
        const suggestions = [];
        for (const {drug, total} of byDrug.values()) {
            const min = drug.minStockLevel || 0;
            if (min > 0 && total < min) {
                suggestions.push({
                    drugId: drug.id,
                    name: drug.name,
                    onHand: total,
                    minStockLevel: min,
                    suggestedOrderQty: Math.max(min * 2 - total, min),
                });
            }
        }
        return suggestions;
    }
}
