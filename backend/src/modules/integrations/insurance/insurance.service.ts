import { InsuranceAdapter } from './adapters/BaseInsuranceAdapter';

export class InsuranceService {
    private adapters: Map<string, InsuranceAdapter> = new Map();

    registerAdapter(provider: string, adapter: InsuranceAdapter) {
        this.adapters.set(provider, adapter);
    }

    async validatePrescription(provider: string, code: string) {
        const adapter = this.adapters.get(provider);
        if (!adapter) throw new Error(`Provider ${provider} not supported`);
        return adapter.validatePrescription(code);
    }

    async submitClaim(provider: string, data: any) {
        const adapter = this.adapters.get(provider);
        if (!adapter) throw new Error(`Provider ${provider} not supported`);
        return adapter.submitClaim(data);
    }
}
