# Backend & project tests

## Backend

```bash
cd backend
npm install
npm test
```

### Suites

| File | Module |
|------|--------|
| `appError.test.ts` | AppError |
| `asyncHandler.test.ts` | asyncHandler |
| `auth.middleware.test.ts` | JWT auth middleware |
| `auth.service.test.ts` | AuthService (login/logout/profile) |
| `auth.dto.test.ts` | login Zod schema |
| `branches.service.test.ts` | BranchesService |
| `employees.service.test.ts` | EmployeesService |
| `errorHandler.test.ts` | Global Express error handler |
| `inventory.expiring.test.ts` | getExpiringBatches |
| `inventory.transfer.test.ts` | transferStock |
| `jwt.test.ts` | sign/verify tokens |
| `loss-reports.service.test.ts` | Loss report review workflow |
| `pagination.test.ts` | paginate helper |
| `rateLimit.test.ts` | Rate limit store + middleware |
| `rbac.middleware.test.ts` | requireRole |
| `sales.service.test.ts` | recordBatchSale |
| `settings.service.test.ts` | Franchise settings |
| `setup.service.test.ts` | First-manager bootstrap |
| `validation.middleware.test.ts` | Zod validate middleware |

All service tests **mock** TypeORM — no Postgres required.

## Frontend

```bash
cd frontend
npm install
npm test
```

| File | Covers |
|------|--------|
| `__tests__/utils.test.ts` | `cn()` |
| `__tests__/useRole.test.tsx` | RBAC capability flags |
| `__tests__/ErrorContext.test.tsx` | Error toast state |
| `__tests__/apiError.test.ts` | ApiError |
| `__tests__/navigation.test.ts` | locales config |

## Redis rate limiting

Set `REDIS_URL` (e.g. `redis://localhost:6379`) for multi-instance shared counters.
Without it, the in-memory store is used automatically.
