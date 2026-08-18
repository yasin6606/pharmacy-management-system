import dotenv from 'dotenv';
import path from 'path';

const envFile =
    process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';

dotenv.config({path: path.join(process.cwd(), envFile)});

function requireInProduction(key: string, value: string | undefined, fallback?: string): string {
    if (value) return value;
    if (process.env.NODE_ENV === 'production') {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return fallback ?? '';
}

export const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || '3001',
    DATABASE_USERNAME: process.env.DATABASE_USERNAME,
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: requireInProduction(
        'JWT_SECRET',
        process.env.JWT_SECRET,
        'dev-only-insecure-secret-change-me'
    ),
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    TITAK_API_KEY: process.env.TITAK_API_KEY,
    OCR_SERVICE_URL: process.env.OCR_SERVICE_URL,
    REDIS_URL: process.env.REDIS_URL,
    TYPEORM_SYNCHRONIZE: process.env.TYPEORM_SYNCHRONIZE,
};
