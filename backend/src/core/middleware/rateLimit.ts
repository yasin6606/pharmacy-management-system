import {Request, Response, NextFunction} from 'express';
import {AppError} from '../errors/AppError';
import {env} from '../config/env';
import {logger} from '../logger/logger';

/**
 * Pluggable rate-limit store.
 * - MemoryStore: single-instance (default)
 * - RedisStore: multi-instance when REDIS_URL is configured
 */
export interface RateLimitStore {
    /** Returns the new count after incrementing; creates window if missing/expired */
    incr(key: string, windowMs: number): Promise<{count: number; resetAt: number}>;
}

interface WindowState {
    count: number;
    resetAt: number;
}

/** In-process fixed-window store (default). */
export class MemoryRateLimitStore implements RateLimitStore {
    private store = new Map<string, WindowState>();

    constructor() {
        // Drop expired keys periodically to bound memory
        const timer = setInterval(() => {
            const now = Date.now();
            for (const [key, state] of this.store.entries()) {
                if (state.resetAt <= now) this.store.delete(key);
            }
        }, 60_000);
        timer.unref?.();
    }

    async incr(key: string, windowMs: number) {
        const now = Date.now();
        let state = this.store.get(key);

        if (!state || state.resetAt <= now) {
            state = {count: 0, resetAt: now + windowMs};
            this.store.set(key, state);
        }

        state.count += 1;
        return {count: state.count, resetAt: state.resetAt};
    }

    /** Test helper — clear all windows */
    clear() {
        this.store.clear();
    }
}

/**
 * Redis fixed-window store.
 * Uses INCR + EXPIRE so all app instances share the same counters.
 * Loaded dynamically so the app still boots without ioredis installed
 * when REDIS_URL is unset.
 */
export class RedisRateLimitStore implements RateLimitStore {
    private client: any;

    constructor(redisUrl: string) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Redis = require('ioredis');
        this.client = new Redis(redisUrl, {
            maxRetriesPerRequest: 1,
            enableReadyCheck: true,
            lazyConnect: false,
        });
        this.client.on('error', (err: Error) => {
            logger.error(`Redis rate-limit error: ${err.message}`);
        });
    }

    async incr(key: string, windowMs: number) {
        const redisKey = `rl:${key}`;
        const count = await this.client.incr(redisKey);

        // First hit in this window → set TTL
        if (count === 1) {
            await this.client.pexpire(redisKey, windowMs);
        }

        const ttl = await this.client.pttl(redisKey);
        const resetAt = Date.now() + (ttl > 0 ? ttl : windowMs);
        return {count, resetAt};
    }
}

/** Singleton store chosen once at module load */
let sharedStore: RateLimitStore | null = null;

export function getRateLimitStore(): RateLimitStore {
    if (sharedStore) return sharedStore;

    if (env.REDIS_URL) {
        try {
            sharedStore = new RedisRateLimitStore(env.REDIS_URL);
            logger.info('Rate limiter using Redis store');
        } catch (err: any) {
            logger.warn(
                `Redis rate limiter unavailable (${err?.message}); falling back to memory store`
            );
            sharedStore = new MemoryRateLimitStore();
        }
    } else {
        sharedStore = new MemoryRateLimitStore();
    }

    return sharedStore;
}

/** Override store (used by unit tests) */
export function setRateLimitStore(store: RateLimitStore) {
    sharedStore = store;
}

export interface RateLimitOptions {
    windowMs: number;
    max: number;
    keyGenerator?: (req: Request) => string;
    message?: string;
    /** Optional explicit store; defaults to getRateLimitStore() */
    store?: RateLimitStore;
}

/**
 * Express middleware factory — fixed window per key (IP by default).
 */
export function rateLimit(options: RateLimitOptions) {
    const {
        windowMs,
        max,
        keyGenerator = (req) => req.ip || req.socket.remoteAddress || 'unknown',
        message = 'Too many requests, please try again later',
        store,
    } = options;

    return async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const key = keyGenerator(req);
            const activeStore = store ?? getRateLimitStore();
            const {count} = await activeStore.incr(key, windowMs);

            if (count > max) {
                return next(new AppError(message, 429));
            }
            next();
        } catch (err) {
            // Fail open on store errors so auth is not bricked by Redis outages
            logger.warn(`Rate limit store error; allowing request: ${(err as Error).message}`);
            next();
        }
    };
}

/**
 * Login protection: 10 attempts / IP / 15 minutes.
 */
export const loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many login attempts. Please try again in 15 minutes.',
});
