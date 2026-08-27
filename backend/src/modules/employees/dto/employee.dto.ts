import {z} from 'zod';
import {EmployeeRole} from '../entities/Employee';
import {passwordSchema} from '../../../core/utils/passwordPolicy';

export const createEmployeeSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: passwordSchema,
        fullName: z.string().min(1).max(200),
        role: z.nativeEnum(EmployeeRole),
        currentBranchId: z.string().uuid().nullable().optional(),
        isActive: z.boolean().optional(),
    }),
});

export const updateEmployeeSchema = z.object({
    body: z.object({
        email: z.string().email().optional(),
        password: passwordSchema.optional(),
        fullName: z.string().min(1).max(200).optional(),
        role: z.nativeEnum(EmployeeRole).optional(),
        currentBranchId: z.string().uuid().nullable().optional(),
        isActive: z.boolean().optional(),
    }),
    params: z.object({
        id: z.string().uuid(),
    }),
});

export const changeBranchSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        branchId: z.string().uuid(),
    }),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>['body'];
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>['body'];
