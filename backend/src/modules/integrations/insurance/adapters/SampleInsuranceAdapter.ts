import {
    InsuranceAdapter,
    InsuranceClaimInput,
    InsuranceValidateMemberInput,
} from './BaseInsuranceAdapter';

/**
 * Development / sandbox adapter.
 * Replace with real Tamin/Salamat/Mosalah HTTP clients using stored API keys.
 * Does NOT contact external networks.
 */
export class SampleInsuranceAdapter implements InsuranceAdapter {
    constructor(private readonly providerName: string) {}

    async validateMember(input: InsuranceValidateMemberInput) {
        if (!input.memberId || input.memberId.trim().length < 5) {
            return {valid: false, message: 'Member ID too short or missing'};
        }
        // Sandbox: accept any plausible id
        return {
            valid: true,
            message: `${this.providerName} sandbox: member accepted`,
            coverageHintPercent: 70,
        };
    }

    async validatePrescription(code: string) {
        return Boolean(code && code.length > 3);
    }

    async submitClaim(data: InsuranceClaimInput) {
        if (!data.memberId || !data.lines?.length) {
            return {accepted: false, message: 'Missing member or claim lines'};
        }
        const ref = `${this.providerName.toUpperCase()}-CLM-${Date.now()}`;
        return {
            accepted: true,
            claimReference: ref,
            message: 'Sandbox claim accepted — wire real API for production',
        };
    }
}
