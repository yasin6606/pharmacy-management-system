# Error Handling & Logging

## Backend

### AppError
Operational errors use `AppError` (`backend/src/core/errors/AppError.ts`):

- `statusCode`, `code` (machine-readable), optional `details`
- Factories: `badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `tooManyRequests`, `internal`

### Global errorHandler
Maps:

| Source | HTTP | `code` |
|--------|------|--------|
| ZodError | 400 | `VALIDATION_ERROR` |
| AppError | varies | `err.code` |
| QueryFailedError | 400 | `DATABASE_ERROR` |
| JWT errors | 401 | `UNAUTHORIZED` |
| Malformed JSON | 400 | `BAD_REQUEST` |
| Unknown | 500 | `INTERNAL_ERROR` |

Every JSON error body includes `success: false`, `message`, `code`, and `requestId` when available.

### Request logging
`requestLogger` middleware:

- Sets / echoes `x-request-id`
- Logs method, path, status, durationMs, optional userId
- Health checks at `debug` only

### Winston logger
- Level: `LOG_LEVEL` or `debug` (dev) / `info` (prod)
- Console JSON in production; pretty in development
- Optional files when `LOG_TO_FILES=true` → `logs/error.log`, `logs/combined.log`

## Frontend

### ApiError
Axios interceptor builds `ApiError` with `status`, `message`, `code`, `requestId`.

- Network / timeout → status `0`, codes `NETWORK_ERROR` / `TIMEOUT`
- Sends `x-request-id` on each request for correlation

### useApi + ErrorContext
- Maps status to user-facing copy
- Suppresses 401 toasts (redirect handled by interceptor)
- Deduplicates toasts; max 5; auto-dismiss 8s
- Severity: warning (4xx) / error (5xx)

### ErrorToast
Severity-colored toasts; shows API `code` and optional `requestId` for support.

### clientLog
`frontend/lib/logger.ts` — debug/info only in development; warn/error always.

## Operational tips

```bash
# backend logs (Docker)
docker compose logs -f backend

# correlate a user report
# 1. Note requestId from toast or response header x-request-id
# 2. grep backend logs for that id
```
