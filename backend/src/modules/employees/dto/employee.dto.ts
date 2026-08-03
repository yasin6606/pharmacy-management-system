import {z} from 'zod';
import {EmployeeRole} from '../entities/Employee';

export const createEmployeeSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        fullName: z.string().min(1),
        role: z.nativeEnum(EmployeeRole),
        currentBranchId: z.string().uuid().nullable().optional(),   // ✅ accept null / undefined
    }),
});

export const updateEmployeeSchema = z.object({
    body: z.object({
        email: z.string().email().optional(),
        fullName: z.string().min(1).optional(),
        role: z.nativeEnum(EmployeeRole).optional(),
        currentBranchId: z.string().uuid().nullable().optional(),   // ✅ accept null / undefined
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
