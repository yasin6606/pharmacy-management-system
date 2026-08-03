import { z } from 'zod';

export const createDrugSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    brand: z.string().optional(),
    company: z.string().min(1),
    enteringDate: z.string().datetime(),
  }),
});

export const addBatchSchema = z.object({
  body: z.object({
    drugId: z.string().uuid(),
    branchId: z.string().uuid(),
    expirationDate: z.string().datetime(),
    count: z.number().int().min(0),
    isOffer: z.boolean().default(false),
    exchangedQuantity: z.number().int().default(0),
    purchasePrice: z.number().positive().optional(),
    sellingPrice: z.number().positive().optional(),
  }),
});

export const transferStockSchema = z.object({
  body: z.object({
    batchId: z.string().uuid(),
    toBranchId: z.string().uuid(),
    quantity: z.number().int().positive(),
  }),
});

export type CreateDrugInput = z.infer<typeof createDrugSchema>['body'];
export type AddBatchInput = z.infer<typeof addBatchSchema>['body'];
export type TransferStockInput = z.infer<typeof transferStockSchema>['body'];
