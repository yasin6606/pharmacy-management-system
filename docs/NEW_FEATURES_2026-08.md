# New features (gap fill) — 2026-08

Careful implementation of capabilities that were previously missing for real Iranian pharmacy operations.

## What was added

| # | Capability | Implementation notes |
|---|------------|----------------------|
| 1 | Live insurance claim shape | `InsuranceAdapter.validateMember` + `submitClaim`; sandbox adapters for Tamin/Salamat/Mosalah |
| 2 | POS terminal seam | BehMellat adapter documented; sandbox references; real SDK is pharmacy hardware-specific |
| 3 | Prescriptions (noskhe) | `Prescription` entity + `POST/GET /ops/prescriptions` |
| 4 | Controlled drugs | `Drug.isControlled` + `ControlledDrugLog` + `/ops/controlled-logs` |
| 5 | Barcode lookup | `Drug.barcode` + `GET /ops/barcode/:code` |
| 6 | Customer master | `Customer` CRUD `/customers` + UI page |
| 7 | Official invoice numbers | `InvoiceSequence` + `POST /ops/invoices/next` |
| 8 | Cash shift close | `CashShift` open/close with expected vs counted cash |
| 9 | Reorder suggestions | `minStockLevel` + `GET /ops/reorder-suggestions` |
| 10 | Goods receipt → stock | `GoodsReceipt` + creates batches + `purchase` movements |
| 11 | Drug interactions | `DrugInteraction` + check/upsert under `/ops/clinical/*` |
| 12 | SMS credit reminders | `NotificationOutbox`; skipped until `SMS_GATEWAY_URL` set |
| 13 | Offline drafts | Frontend `lib/offlineQueue.ts` (no offline stock decrement) |
| 14 | Accounting export | `GET /ops/accounting/export` simple GL mapping |
| 15 | Audit log | `AuditLog` + `GET /ops/audit` |
| 16 | Backup guidance | `GET /ops/backup-info` (pg_dump instructions) |
| 17 | Multi-tenant | **Not** implemented as SaaS isolation — still single pharmacy org multi-branch |
| 18 | Mobile stock count | Operations/alerts UI mobile-responsive; dedicated count workflow can extend batches page |
| 19 | Stock / expiry alerts API | `GET /ops/alerts/stock` |
| 20 | Migrations path | `migrations/` registered on DataSource + README |

## API prefix

- Customers: `/api/v1/customers`
- Ops hub: `/api/v1/ops/*`

## UI

- `/[locale]/customers`
- `/[locale]/operations` (shifts, barcode, alerts, reorder, audit, backup info)

## Safety notes

- Insurance/POS adapters are **sandbox** until real credentials and terminal SDKs are configured.
- Offline queue does **not** mutate stock locally.
- Enable `TYPEORM_SYNCHRONIZE=true` once on existing DBs to create new tables, then turn it off and migrate formally.

## Rebuild

```bash
cd infrastructure
docker compose up -d --build backend frontend
```
