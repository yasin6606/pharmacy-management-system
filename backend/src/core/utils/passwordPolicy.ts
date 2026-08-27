import {z} from 'zod';

/**
 * Pharmacy staff password policy:
 * - min 8 characters
 * - at least one letter and one digit
 * (Keeps UX usable on POS keyboards while blocking trivial passwords.)
 */
export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[A-Za-z]/, 'Password must include at least one letter')
    .regex(/[0-9]/, 'Password must include at least one number');

export const BCRYPT_ROUNDS = 12;
