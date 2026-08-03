import jwt from 'jsonwebtoken';
import {env} from '../config/env';

export const signToken = (payload: object): string => {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],   // ✅ type-safe cast
    });
};

export const verifyToken = (token: string): any => {
    return jwt.verify(token, env.JWT_SECRET);
};
