import {PosAdapter, PosTransactionRequest, PosTransactionResult} from "../PosAdapter";

export class BehMellatAdapter extends PosAdapter {
    async initiatePayment(req: PosTransactionRequest): Promise<PosTransactionResult> {
        // TODO: Call Beh Mellat POS API / SDK
        return {success: true, referenceCode: 'BM-' + Date.now()};
    }

    async checkStatus(code: string): Promise<PosTransactionResult> {
        return {success: true, referenceCode: code};
    }
}
