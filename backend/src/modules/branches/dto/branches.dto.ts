import { z } from 'zod';

export const createBranchSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Branch name is required'),
    address: z.string().optional(),
    isWarehouse: z.boolean().default(false),
  }),
});

export const updateBranchSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    address: z.string().optional(),
    isWarehouse: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid branch ID'),
  }),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>['body'];
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>['body'];
