# TypeORM migrations

## Policy

- **Development:** `TYPEORM_SYNCHRONIZE=true` may create/alter schema from entities.
- **Production:** keep `TYPEORM_SYNCHRONIZE=false` and apply migrations.

`AppDataSource` loads files from `backend/src/migrations/*.{ts,js}`.

## Generate (example)

```bash
cd backend
npx typeorm migration:generate src/migrations/AddPharmacyOpsFeatures -d src/core/config/data-source.ts
npx typeorm migration:run -d src/core/config/data-source.ts
```

## New entities (2026-08 expansion)

Ensure production DBs receive tables for:

- `customers`
- `prescriptions`
- `invoice_sequences`
- `cash_shifts`
- `audit_logs`
- `drug_interactions`
- `notification_outbox`
- `goods_receipts`
- `controlled_drug_logs`

And drug columns: `barcode`, `is_controlled`, `min_stock_level`, `notes`.

Stock movement enum should include `purchase`.

Until a formal migration file is committed, bootstrap environments may use synchronize once, then disable it.
