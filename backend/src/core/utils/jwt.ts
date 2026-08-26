import jwt from 'jsonwebtoken';
import {env} from '../config/env';

export interface JwtPayload {
    userId: string;
    role: string;
    branchId?: string | null;
    sessionId: string;
}

export const signToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
};

export const verifyToken = (token: string): JwtPayload => {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object') {
        throw new Error('Invalid token payload');
    }
    const p = decoded as Record<string, unknown>;
    if (typeof p.userId !== 'string' || typeof p.sessionId !== 'string' || typeof p.role !== 'string') {
        throw new Error('Invalid token claims');
    }
    return {
        userId: p.userId,
        role: p.role,
        branchId: (p.branchId as string | null | undefined) ?? null,
        sessionId: p.sessionId,
    };
};
