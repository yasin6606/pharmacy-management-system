# New features (gap fill) — 2026-08

Careful implementation of capabilities that were previously missing for real Iranian pharmacy operations, plus **security & ops hardening** (2026-08-27).

## What was added (domain)

| # | Capability | Implementation notes |
|---|------------|----------------------|
| 1 | Live insurance claim shape | `InsuranceAdapter.validateMember` + `submitClaim`; sandbox adapters for Tamin/Salamat/Mosalah |
| 2 | POS terminal seam | BehMellat adapter aligned to `PosAdapter`; sandbox references; real SDK is pharmacy hardware-specific |
| 3 | Prescriptions (noskhe) | `Prescription` entity + `POST/GET /ops/prescriptions` |
| 4 | Controlled drugs | `Drug.isControlled` + `ControlledDrugLog` + `/ops/controlled-logs` |
| 5 | Barcode lookup | `Drug.barcode` + `GET /ops/barcode/:code` |
| 6 | Customer master | `Customer` CRUD `/customers` + UI page |
| 7 | Official invoice numbers | `InvoiceSequence` + `POST /ops/invoices/next` |
| 8 | Cash shift close | `CashShift` open/close with expected vs counted cash |
| 9 | Reorder suggestions | `minStockLevel` + `GET /ops/reorder-suggestions` |
| 10 | Goods receipt → stock | `GoodsReceipt` + creates batches + `purchase` movements |
| 11 | Drug interactions | `DrugInteraction` + check/upsert under `/ops/clinical/*` |
| 12 | SMS credit reminders | `NotificationOutbox`; skipped until SMS gateway configured |
| 13 | Offline drafts | Frontend `lib/offlineQueue.ts` (no offline stock decrement) |
| 14 | Accounting export | `GET /ops/accounting/export` simple GL mapping |
| 15 | Audit log | `AuditLog` + `GET /ops/audit` |
| 16 | Backup guidance | `GET /ops/backup-info` (pg_dump instructions) |
| 17 | Multi-tenant | **Not** implemented as SaaS isolation — still single pharmacy org multi-branch |
| 18 | Mobile stock count | Operations/alerts UI mobile-responsive |
| 19 | Stock / expiry alerts API | `GET /ops/alerts/stock` |
| 20 | Migrations path | `BaselinePharmacyOps` migration + CLI DataSource entity parity |

## Security & platform hardening (2026-08-27)

| Item | Detail |
|------|--------|
| Session invalidation | Logout sets `logout_time`; `authMiddleware` requires active session |
| JWT claims | Typed `JwtPayload` (`userId`, `role`, `sessionId`, optional `branchId`) |
| Token TTL | Default **`JWT_EXPIRES_IN=8h`** (was 7d) |
| CORS | `CORS_ORIGIN` allowlist; production denies browser origins if unset |
| Ops RBAC | All `/ops/*` routes use `staff` / `seniorPlus` / `managerPlus` / `managerOnly` |
| IRR scale | `DrugBatch` purchase/selling prices `numeric(18,0)` |
| Baseline migration | `backend/src/migrations/1735689600000-BaselinePharmacyOps.ts` |

## API prefix

- Customers: `/api/v1/customers`
- Ops hub: `/api/v1/ops/*` (authenticated + role-gated)

## UI

- `/[locale]/customers`
- `/[locale]/operations` (shifts, barcode, alerts, reorder, audit, backup info)

## Safety notes

- Insurance/POS adapters are **sandbox** until real credentials and terminal SDKs are configured.
- Offline queue does **not** mutate stock locally.
- Prefer `TYPEORM_SYNCHRONIZE=false` and run **`BaselinePharmacyOps`** (or generate further migrations) in production.
- Users must **re-login** after logout or JWT secret rotation.

## Rebuild

```bash
cd infrastructure
docker compose up -d --build backend frontend
```
