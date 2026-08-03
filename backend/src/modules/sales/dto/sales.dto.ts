import { z } from 'zod';

export const recordSaleSchema = z.object({
  body: z.object({
    drugBatchId: z.string().uuid(),
    quantity: z.number().int().positive(),
    prescriptionRef: z.string().optional(),
  }),
});

export const getSalesQuerySchema = z.object({
  query: z.object({
    branchId: z.string().uuid().optional(),
    employeeId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export type RecordSaleInput = z.infer<typeof recordSaleSchema>['body'];
export type GetSalesQuery = z.infer<typeof getSalesQuerySchema>['query'];
