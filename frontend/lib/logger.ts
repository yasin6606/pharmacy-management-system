/**
 * Lightweight frontend logger.
 * - dev: console with level tags
 * - prod: errors only (console) — wire to Sentry/etc. by replacing sink
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const isDev = process.env.NODE_ENV !== 'production';

function emit(level: Level, message: string, meta?: Record<string, unknown>) {
    const payload = meta ? {message, ...meta} : message;
    if (level === 'error') {
        console.error('[pharmacy]', payload);
        return;
    }
    if (level === 'warn') {
        console.warn('[pharmacy]', payload);
        return;
    }
    if (isDev) {
        if (level === 'info') console.info('[pharmacy]', payload);
        else console.debug('[pharmacy]', payload);
    }
}

export const clientLog = {
    debug: (message: string, meta?: Record<string, unknown>) => emit('debug', message, meta),
    info: (message: string, meta?: Record<string, unknown>) => emit('info', message, meta),
    warn: (message: string, meta?: Record<string, unknown>) => emit('warn', message, meta),
    error: (message: string, meta?: Record<string, unknown>) => emit('error', message, meta),
};
