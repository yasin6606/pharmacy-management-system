/**
 * Operational application error — safe to surface to API clients.
 * Unexpected errors should remain generic 500s (see errorHandler).
 *
 * Backward compatible:
 *   new AppError(message, statusCode)
 *   new AppError(message, statusCode, false) // isOperational
 *   new AppError(message, statusCode, { code, details, isOperational })
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly code: string;
    public readonly details?: Record<string, unknown>;

    constructor(
        message: string,
        statusCode: number = 400,
        optionsOrOperational?:
            | boolean
            | {
                  isOperational?: boolean;
                  code?: string;
                  details?: Record<string, unknown>;
              }
    ) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;

        if (typeof optionsOrOperational === 'boolean') {
            this.isOperational = optionsOrOperational;
            this.code = defaultCode(statusCode);
            this.details = undefined;
        } else {
            this.isOperational = optionsOrOperational?.isOperational ?? true;
            this.code = optionsOrOperational?.code ?? defaultCode(statusCode);
            this.details = optionsOrOperational?.details;
        }

        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message: string, details?: Record<string, unknown>) {
        return new AppError(message, 400, {code: 'BAD_REQUEST', details});
    }

    static unauthorized(message = 'Unauthorized') {
        return new AppError(message, 401, {code: 'UNAUTHORIZED'});
    }

    static forbidden(message = 'Forbidden') {
        return new AppError(message, 403, {code: 'FORBIDDEN'});
    }

    static notFound(message = 'Resource not found') {
        return new AppError(message, 404, {code: 'NOT_FOUND'});
    }

    static conflict(message: string) {
        return new AppError(message, 409, {code: 'CONFLICT'});
    }

    static tooManyRequests(message = 'Too many requests') {
        return new AppError(message, 429, {code: 'RATE_LIMITED'});
    }

    static internal(message = 'Internal server error') {
        return new AppError(message, 500, {isOperational: false, code: 'INTERNAL_ERROR'});
    }
}

function defaultCode(status: number): string {
    if (status === 400) return 'BAD_REQUEST';
    if (status === 401) return 'UNAUTHORIZED';
    if (status === 403) return 'FORBIDDEN';
    if (status === 404) return 'NOT_FOUND';
    if (status === 409) return 'CONFLICT';
    if (status === 429) return 'RATE_LIMITED';
    if (status >= 500) return 'INTERNAL_ERROR';
    return 'ERROR';
}
