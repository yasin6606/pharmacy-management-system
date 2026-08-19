import {
    PosAdapter,
    PosTransactionRequest,
    PosTransactionResult,
} from '../PosAdapter';

/**
 * BehPardakht / Beh Mellat style terminal adapter.
 *
 * PRODUCTION: replace initiatePayment/checkStatus with the vendor PC-POS
 * or LAN protocol used by your terminal (serial/TCP). Keep amounts in IRR.
 *
 * This sandbox never talks to a physical device — suitable for UI/E2E tests.
 */
export class BehMellatAdapter implements PosAdapter {
    async initiatePayment(req: PosTransactionRequest): Promise<PosTransactionResult> {
        const amount = Number(req.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            return {
                success: false,
                referenceCode: '',
                message: 'POS amount must be positive IRR',
            };
        }

        const terminalId = (req.terminalId || 'T1').trim();
        const referenceCode = `BM-${terminalId}-${Date.now()}`;

        return {
            success: true,
            referenceCode,
            message: req.invoiceId
                ? `Pending on terminal ${terminalId} for invoice ${req.invoiceId}`
                : `Pending on terminal ${terminalId}`,
        };
    }

    async checkStatus(referenceCode: string): Promise<PosTransactionResult> {
        // Sandbox: unknown references fail; BM-* refs stay pending until cashier confirms
        if (!referenceCode?.startsWith('BM-')) {
            return {
                success: false,
                referenceCode: referenceCode || '',
                message: 'Unknown POS reference',
            };
        }

        return {
            success: false,
            referenceCode,
            message: 'Awaiting terminal / cashier confirmation',
        };
    }
}
