import {InsuranceAdapter, InsuranceClaimInput, InsuranceValidateMemberInput} from './adapters/BaseInsuranceAdapter';
import {SampleInsuranceAdapter} from './adapters/SampleInsuranceAdapter';
import {AppError} from '../../../core/errors/AppError';

export class InsuranceService {
    private adapters: Map<string, InsuranceAdapter> = new Map();

    constructor() {
        // Sandbox providers until real credentials/endpoints are configured
        this.registerAdapter('tamin', new SampleInsuranceAdapter('tamin'));
        this.registerAdapter('salamat', new SampleInsuranceAdapter('salamat'));
        this.registerAdapter('mosalah', new SampleInsuranceAdapter('mosalah'));
        this.registerAdapter('other', new SampleInsuranceAdapter('other'));
    }

    registerAdapter(provider: string, adapter: InsuranceAdapter) {
        this.adapters.set(provider.toLowerCase(), adapter);
    }

    private getAdapter(provider: string): InsuranceAdapter {
        const adapter = this.adapters.get(provider.toLowerCase());
        if (!adapter) throw AppError.badRequest(`Insurance provider not supported: ${provider}`);
        return adapter;
    }

    async validateMember(input: InsuranceValidateMemberInput) {
        return this.getAdapter(input.provider).validateMember(input);
    }

    async validatePrescription(provider: string, code: string) {
        const adapter = this.getAdapter(provider);
        if (adapter.validatePrescription) return adapter.validatePrescription(code);
        const result = await adapter.validateMember({memberId: code, provider});
        return result.valid;
    }

    async submitClaim(provider: string, data: Omit<InsuranceClaimInput, 'provider'> & {provider?: string}) {
        return this.getAdapter(provider).submitClaim({...data, provider});
    }
}
