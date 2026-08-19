import {Request, Response, NextFunction} from 'express';
import {randomUUID} from 'crypto';
import {logger} from '../logger/logger';

/**
 * Assigns x-request-id and logs method/path/status/duration.
 * Skip noisy health probes at debug level only.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const incoming = req.headers['x-request-id'];
    const id = typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID();
    (req as any).id = id;
    res.setHeader('x-request-id', id);

    const start = process.hrtime.bigint();

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        const path = req.originalUrl || req.url;
        const isHealth = path === '/health' || path.endsWith('/health');

        const meta = {
            requestId: id,
            method: req.method,
            path,
            status: res.statusCode,
            durationMs: Math.round(durationMs * 100) / 100,
            userId: (req as any).user?.userId,
        };

        if (isHealth) {
            logger.debug('health', meta);
            return;
        }

        if (res.statusCode >= 500) {
            logger.error('http', meta);
        } else if (res.statusCode >= 400) {
            logger.warn('http', meta);
        } else {
            logger.info('http', meta);
        }
    });

    next();
}
