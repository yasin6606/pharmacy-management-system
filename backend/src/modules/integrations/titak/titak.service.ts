import axios from 'axios';
import {env} from '../../../core/config/env';
import {AppDataSource} from '../../../core/config/database';
import {Drug} from '../../inventory/entities/Drug';
import {DrugBatch} from '../../inventory/entities/DrugBatch';
import {AppError} from '../../../core/errors/AppError';
import {SettingsService, INTEGRATION_KEYS} from '../../settings/settings.service';

/**
 * Titak price sync.
 *
 * Resolution order for credentials:
 * 1. Integration setting `titak_api_key` (Settings UI)
 * 2. Environment `TITAK_API_KEY`
 *
 * Base URL defaults to https://api.titak.ir/v1 unless overridden.
 * If the live Titak contract differs, set `titak_base_url` in settings.
 */
export class TitakService {
    private settings = new SettingsService();

    private async resolveCredentials() {
        const dbKey = await this.settings.getIntegration(INTEGRATION_KEYS.TITAK_API_KEY);
        const dbUrl = await this.settings.getIntegration(INTEGRATION_KEYS.TITAK_BASE_URL);
        const apiKey = (dbKey || env.TITAK_API_KEY || '').trim();
        const baseUrl = (dbUrl || 'https://api.titak.ir/v1').replace(/\/$/, '');
        return {apiKey, baseUrl};
    }

    async updatePrice(drugId: string) {
        const {apiKey, baseUrl} = await this.resolveCredentials();
        if (!apiKey) {
            throw new AppError(
                'Titak API key is not configured. Add it under Settings → Integrations.',
                400
            );
        }

        const drug = await AppDataSource.getRepository(Drug).findOne({where: {id: drugId}});
        if (!drug) throw new AppError('Drug not found', 404);

        const externalId = (drug.titakCode || drug.id).trim();
        if (!externalId) {
            throw new AppError('Drug has no Titak code. Set titakCode on the drug first.', 400);
        }

        let newPrice: number;
        try {
            const response = await axios.get(`${baseUrl}/drugs/${encodeURIComponent(externalId)}/price`, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    Accept: 'application/json',
                },
                timeout: 15000,
            });
            const payload = response.data;
            newPrice = Number(
                payload?.price ?? payload?.data?.price ?? payload?.sellingPrice ?? payload?.amount
            );
            if (!Number.isFinite(newPrice) || newPrice < 0) {
                throw new AppError('Titak response did not include a valid price', 502);
            }
        } catch (err: any) {
            if (err instanceof AppError) throw err;
            const status = err?.response?.status;
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to reach Titak price API';
            throw new AppError(
                `Titak price update failed${status ? ` (${status})` : ''}: ${msg}`,
                status && status >= 400 && status < 600 ? status : 502
            );
        }

        await AppDataSource.transaction(async (manager) => {
            drug.lastPriceUpdateDate = new Date();
            await manager.save(drug);
            await manager.update(DrugBatch, {drugId}, {sellingPrice: newPrice});
        });

        return {newPrice, currency: 'IRR', titakCode: externalId};
    }
}
