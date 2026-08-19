/**
 * Contract for Iranian social-insurance providers (Tamin, Salamat, Mosalah, …).
 * Real pharmacies plug HTTP clients that use credentials from IntegrationSetting.
 */
export interface InsuranceValidateMemberInput {
    memberId: string;
    nationalId?: string;
    provider: string;
}

export interface InsuranceClaimLine {
    insuranceCode?: string | null;
    drugName: string;
    quantity: number;
    unitPrice: number;
    coverageAmount: number;
}

export interface InsuranceClaimInput {
    memberId: string;
    provider: string;
    lines: InsuranceClaimLine[];
    prescriptionRef?: string;
    branchId?: string;
}

export interface InsuranceAdapter {
    validateMember(input: InsuranceValidateMemberInput): Promise<{
        valid: boolean;
        message?: string;
        coverageHintPercent?: number;
    }>;

    /** @deprecated prefer validateMember */
    validatePrescription?(code: string): Promise<boolean>;

    submitClaim(data: InsuranceClaimInput): Promise<{
        accepted: boolean;
        claimReference?: string;
        message?: string;
    }>;
}
