import {Request, Response, NextFunction} from 'express';
import {AppError} from '../errors/AppError';

/**
 * Lightweight in-memory rate limiter.
 * Suitable for single-instance deployments. For multi-instance / production
 * scale-out, replace the store with Redis (or similar shared backend).
 *
 * Algorithm: fixed window per key (IP by default).
 */
interface RateLimitOptions {
    /** Max requests allowed inside the window */
    windowMs: number;
    /** Window duration in milliseconds */
    max: number;
    /** Optional custom key generator (defaults to client IP) */
    keyGenerator?: (req: Request) => string;
    /** Message returned when the limit is exceeded */
    message?: string;
}

interface WindowState {
    count: number;
    resetAt: number;
}

const store = new Map<string, WindowState>();

/** Periodically drop expired windows to avoid unbounded memory growth */
setInterval(() => {
    const now = Date.now();
    for (const [key, state] of store.entries()) {
        if (state.resetAt <= now) store.delete(key);
    }
}, 60_000).unref?.();

export function rateLimit(options: RateLimitOptions) {
    const {
        windowMs,
        max,
        keyGenerator = (req) => req.ip || req.socket.remoteAddress || 'unknown',
        message = 'Too many requests, please try again later',
    } = options;

    return (req: Request, _res: Response, next: NextFunction) => {
        const key = keyGenerator(req);
        const now = Date.now();
        let state = store.get(key);

        if (!state || state.resetAt <= now) {
            state = {count: 0, resetAt: now + windowMs};
            store.set(key, state);
        }

        state.count += 1;

        if (state.count > max) {
            return next(new AppError(message, 429));
        }

        next();
    };
}

/**
 * Pre-configured limiter for authentication endpoints.
 * 10 attempts per IP every 15 minutes — enough for legitimate retries,
 * tight enough to slow credential stuffing.
 */
export const loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many login attempts. Please try again in 15 minutes.',
});
