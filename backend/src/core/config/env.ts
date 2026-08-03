import dotenv from 'dotenv';
import path from "path";

const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

dotenv.config({path: path.join(process.cwd(), envFile)});

export const env = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_USERNAME: process.env.DATABASE_USERNAME,
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET || "qazwsx",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "5m",
    TITAK_API_KEY: process.env.TITAK_API_KEY,
    OCR_SERVICE_URL: process.env.OCR_SERVICE_URL,
    REDIS_URL: process.env.REDIS_URL,
    TYPEORM_SYNCHRONIZE: process.env.TYPEORM_SYNCHRONIZE
};
