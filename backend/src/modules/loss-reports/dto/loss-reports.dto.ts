import { z } from 'zod';
import { LossReportStatus } from '../entities/LossReport';

export const createLossReportSchema = z.object({
  body: z.object({
    drugId: z.string().uuid(),
    quantity: z.number().int().positive(),
    reason: z.string().min(1),
  }),
});

export const reviewLossReportSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.nativeEnum(LossReportStatus),
  }),
});

export type CreateLossReportInput = z.infer<typeof createLossReportSchema>['body'];
export type ReviewLossReportInput = z.infer<typeof reviewLossReportSchema>['body'];
