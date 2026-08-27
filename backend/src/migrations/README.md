# TypeORM migrations

## Policy

- **Development:** `TYPEORM_SYNCHRONIZE=true` may create/alter schema from entities.
- **Production:** keep `TYPEORM_SYNCHRONIZE=false` and apply migrations.

`AppDataSource` loads files from `backend/src/migrations/*.{ts,js}`.

## Included migrations

- `1735689600000-BaselinePharmacyOps.ts` — additive tables/columns for ops, customers, insurance fields, IRR scale.
- `1735776000000-EmployeeIsActive.ts` — `employees.is_active` for account disable without delete.

## Generate / run

```bash
cd backend
npm run migration:run
# or:
npx typeorm-ts-node-commonjs migration:run -d src/core/config/data-source.ts
```

## New entities (2026-08 expansion)

Ensure production DBs receive tables for customers, prescriptions, invoice_sequences,
cash_shifts, audit_logs, drug_interactions, notification_outbox, goods_receipts,
controlled_drug_logs, and drug columns barcode / is_controlled / min_stock_level / notes.
