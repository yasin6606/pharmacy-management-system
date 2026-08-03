export interface InsuranceAdapter {
  validatePrescription(code: string): Promise<any>;
  submitClaim(data: any): Promise<any>;
}
