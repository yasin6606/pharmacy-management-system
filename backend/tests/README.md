# Backend tests

## Run

```bash
cd backend
npm install
npm test
```

## Coverage areas

| Suite | What it guards |
|-------|----------------|
| `rateLimit.test.ts` | Fixed-window counting + 429 after max |
| `sales.service.test.ts` | Basket sale validation, stock checks, decrement path |
| `inventory.transfer.test.ts` | Inter-branch transfer validation & movement |
| `appError.test.ts` | Operational error shape |

Tests **mock** TypeORM transactions — no PostgreSQL required.

## Redis rate limiting (optional)

Set `REDIS_URL` in the environment (e.g. `redis://localhost:6379`).
The rate limiter auto-selects `RedisRateLimitStore` so multiple API instances share login counters.
If Redis is unreachable, the middleware **fails open** (allows the request) and logs a warning.
