import {PosAdapter} from '../PosAdapter';

/**
 * BehPardakht / Beh Mellat style terminal adapter.
 *
 * PRODUCTION: replace initiatePayment/checkStatus with the vendor PC-POS
 * or LAN protocol used by your terminal (serial/TCP). Keep amounts in IRR.
 *
 * This sandbox never talks to a physical device — suitable for UI/E2E tests.
 */
export class BehMellatAdapter implements PosAdapter {
    async initiatePayment(amount: number, terminalId?: string): Promise<{
        referenceCode: string;
        status: string;
    }> {
        if (amount <= 0) {
            throw new Error('POS amount must be positive IRR');
        }
        const referenceCode = `BM-${terminalId || 'T1'}-${Date.now()}`;
        return {
            referenceCode,
            status: 'pending',
        };
    }

    async checkStatus(referenceCode: string): Promise<{status: string; approved?: boolean}> {
        // Sandbox: unknown references are pending; callers confirm via /confirm
        if (!referenceCode?.startsWith('BM-')) {
            return {status: 'unknown', approved: false};
        }
        return {status: 'pending'};
    }
}
