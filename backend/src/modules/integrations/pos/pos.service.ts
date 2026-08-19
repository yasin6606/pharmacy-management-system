import {AppError} from '../../../core/errors/AppError';
import {BehMellatAdapter} from './adapters/BehMellatAdapter';
import {PosAdapter, PosTransactionResult} from './PosAdapter';
import {SettingsService} from '../../settings/settings.service';

/** In-memory session store for POS handshakes (single-node; swap for Redis in multi-instance). */
const sessions = new Map<
    string,
    {amount: number; terminalId: string; status: 'pending' | 'approved' | 'failed'; createdAt: number}
>();

const SESSION_TTL_MS = 15 * 60 * 1000;

export class PosService {
    private adapter: PosAdapter = new BehMellatAdapter();
    private settings = new SettingsService();

    private purgeExpired() {
        const now = Date.now();
        for (const [key, val] of sessions.entries()) {
            if (now - val.createdAt > SESSION_TTL_MS) sessions.delete(key);
        }
    }

    /**
     * Start a card-terminal payment for amount (IRR, whole rials).
     * Returns a reference the cashier uses to confirm after the terminal responds.
     */
    async initiate(amount: number, terminalId?: string) {
        this.purgeExpired();
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new AppError('POS amount must be a positive number (IRR)', 400);
        }
        const rounded = Math.round(amount);
        const terminal =
            (terminalId || (await this.settings.getIntegration('pos_terminal_id')) || 'DEFAULT').trim();

        const result = await this.adapter.initiatePayment({
            amount: rounded,
            terminalId: terminal,
            invoiceId: `INV-${Date.now()}`,
        });

        if (!result.success || !result.referenceCode) {
            throw new AppError(result.message || 'POS terminal rejected the request', 502);
        }

        sessions.set(result.referenceCode, {
            amount: rounded,
            terminalId: terminal,
            status: 'pending',
            createdAt: Date.now(),
        });

        return {
            referenceCode: result.referenceCode,
            amount: rounded,
            currency: 'IRR',
            terminalId: terminal,
            status: 'pending' as const,
            message:
                result.message ||
                'Send the customer to the terminal. Confirm success when the bank slip prints.',
        };
    }

    /** Poll / mark terminal outcome. In production, checkStatus talks to the acquirer. */
    async confirm(referenceCode: string, approved: boolean = true): Promise<PosTransactionResult & {amount?: number}> {
        this.purgeExpired();
        if (!referenceCode?.trim()) throw new AppError('POS reference is required', 400);

        const session = sessions.get(referenceCode);
        if (!session) {
            // Still allow adapter status check for external refs
            const remote = await this.adapter.checkStatus(referenceCode);
            return remote;
        }

        if (approved) {
            session.status = 'approved';
            const remote = await this.adapter.checkStatus(referenceCode);
            return {
                success: true,
                referenceCode,
                amount: session.amount,
                message: remote.message || 'POS payment approved',
            };
        }

        session.status = 'failed';
        sessions.delete(referenceCode);
        return {success: false, referenceCode, message: 'POS payment cancelled or failed'};
    }

    async getStatus(referenceCode: string) {
        this.purgeExpired();
        const session = sessions.get(referenceCode);
        if (session) {
            return {
                referenceCode,
                amount: session.amount,
                currency: 'IRR',
                status: session.status,
                terminalId: session.terminalId,
            };
        }
        const remote = await this.adapter.checkStatus(referenceCode);
        return {
            referenceCode,
            status: remote.success ? 'approved' : 'unknown',
            message: remote.message,
        };
    }
}
