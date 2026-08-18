import {AppDataSource} from '../../core/config/database';
import {Settings} from './entities/Settings';
import {IntegrationSetting} from './entities/IntegrationSetting';
import {AppError} from '../../core/errors/AppError';

/** Known integration keys (documented for operators). */
export const INTEGRATION_KEYS = {
    TITAK_API_KEY: 'titak_api_key',
    TITAK_BASE_URL: 'titak_base_url',
    INSURANCE_TAMIN_API_KEY: 'insurance_tamin_api_key',
    INSURANCE_SALAMAT_API_KEY: 'insurance_salamat_api_key',
    INSURANCE_MOSALAH_API_KEY: 'insurance_mosalah_api_key',
    INSURANCE_DEFAULT_COVERAGE_PERCENT: 'insurance_default_coverage_percent',
} as const;

const SECRET_KEYS = new Set<string>([
    INTEGRATION_KEYS.TITAK_API_KEY,
    INTEGRATION_KEYS.INSURANCE_TAMIN_API_KEY,
    INTEGRATION_KEYS.INSURANCE_SALAMAT_API_KEY,
    INTEGRATION_KEYS.INSURANCE_MOSALAH_API_KEY,
]);

function maskSecret(value: string): string {
    if (!value) return '';
    if (value.length <= 4) return '****';
    return `${'*'.repeat(Math.min(12, value.length - 4))}${value.slice(-4)}`;
}

export class SettingsService {
    private repo = AppDataSource.getRepository(Settings);
    private integrationRepo = AppDataSource.getRepository(IntegrationSetting);

    async getFranchiseAmount(): Promise<number> {
        const setting = await this.repo.findOneBy({key: 'franchise_amount'});
        return setting ? Number(setting.value) : 0;
    }

    async setFranchiseAmount(amount: number) {
        let setting = await this.repo.findOneBy({key: 'franchise_amount'});
        if (!setting) {
            setting = this.repo.create({key: 'franchise_amount', value: amount});
        } else {
            setting.value = amount;
        }
        return this.repo.save(setting);
    }

    async getIntegration(key: string): Promise<string> {
        const row = await this.integrationRepo.findOneBy({key});
        return row?.value ?? '';
    }

    async setIntegration(key: string, value: string) {
        if (!key?.trim()) throw new AppError('Integration key is required', 400);
        let row = await this.integrationRepo.findOneBy({key});
        if (!row) {
            row = this.integrationRepo.create({key, value: value ?? ''});
        } else {
            row.value = value ?? '';
        }
        return this.integrationRepo.save(row);
    }

    /** Masked view for UI — never return full secrets. */
    async listIntegrationsMasked() {
        const keys = Object.values(INTEGRATION_KEYS);
        const rows = await this.integrationRepo.find();
        const map = new Map(rows.map((r) => [r.key, r.value]));

        return keys.map((key) => {
            const raw = map.get(key) ?? '';
            const isSecret = SECRET_KEYS.has(key);
            return {
                key,
                configured: Boolean(raw),
                value: isSecret ? maskSecret(raw) : raw,
                isSecret,
            };
        });
    }

    async upsertIntegrations(entries: {key: string; value: string}[]) {
        const allowed = new Set(Object.values(INTEGRATION_KEYS));
        for (const entry of entries) {
            if (!allowed.has(entry.key as any)) {
                throw new AppError(`Unknown integration key: ${entry.key}`, 400);
            }
            // Empty string means "leave unchanged" for secrets so UI can save other fields
            if (SECRET_KEYS.has(entry.key) && entry.value === '') {
                continue;
            }
            await this.setIntegration(entry.key, entry.value.trim());
        }
        return this.listIntegrationsMasked();
    }

    async getDefaultInsuranceCoveragePercent(): Promise<number> {
        const raw = await this.getIntegration(INTEGRATION_KEYS.INSURANCE_DEFAULT_COVERAGE_PERCENT);
        const n = Number(raw);
        if (Number.isFinite(n) && n >= 0 && n <= 100) return n;
        return 70; // typical default patient co-pay inverted: insurer covers 70%
    }
}
