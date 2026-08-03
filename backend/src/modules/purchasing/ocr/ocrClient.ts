import axios from 'axios';
import { env } from '../../../core/config/env';

export const ocrClient = {
    async parseInvoice(imageBuffer: Buffer) {
        if (!env.OCR_SERVICE_URL) {
            // Mock response
            return {
                supplier: 'Demo Supplier',
                items: [{ drugName: 'Paracetamol', quantity: 100, price: 10.5 }],
            };
        }
        const response = await axios.post(env.OCR_SERVICE_URL, imageBuffer, {
            headers: { 'Content-Type': 'application/octet-stream' },
        });
        return response.data;
    },
};
