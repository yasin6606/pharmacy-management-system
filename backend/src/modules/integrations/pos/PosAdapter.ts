export interface PosTransactionRequest {
    amount: number;
    terminalId: string;
    invoiceId?: string;
}

export interface PosTransactionResult {
    success: boolean;
    referenceCode: string;
    message?: string;
}

export abstract class PosAdapter {
    abstract initiatePayment(req: PosTransactionRequest): Promise<PosTransactionResult>;

    abstract checkStatus(referenceCode: string): Promise<PosTransactionResult>;
}
