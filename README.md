# Pharmacy Management System

Multi-branch pharmacy operations platform for Iranian pharmacies: inventory with batch expiry, POS sales in **IRR**, insurance-aware checkout, Titak price sync, role-based staff access, ops hub (shifts, prescriptions, controlled drugs, audit), Docker deployment, structured logging, and professional API error contracts.

**Author:** [yasin](https://github.com/yasin6606)  
**Repository:** [yasin6606/pharmacy-management-system](https://github.com/yasin6606/pharmacy-management-system)

📘 **Full catalog:** [docs/PROJECT_CATALOG.md](./docs/PROJECT_CATALOG.md) — complete technical & product reference.

---

## Features

### Core
- Multi-branch warehouses & retail sites with stock transfers
- RBAC: `junior` · `senior` · `manager` · `accountant`
- Employee sessions with **server-side invalidation on logout** (JWT alone is not enough)
- JWT access tokens (default TTL **8h**) + bcrypt passwords
- First-run **setup** wizard for the manager account

### Inventory
- Drug catalog: search, create, edit, safe delete (blocked while stock remains)
- Batches: expiry, quantity, offer flag, purchase/selling price (**whole IRR / scale 0**)
- Stock movements: transfer · sale · purchase (goods receipt)
- **Titak code** + **Update price** via Titak API (key in Settings)
- **Insurance eligible** flag + formulary code per drug
- Barcode lookup, min stock, controlled-drug flag
- Catalog stats for dashboard KPIs

### Sales & POS
- Multi-tab patient baskets
- Payment: cash · transfer · **POS (initiate → terminal confirm → complete)** · credit
- Patient insurance: Tamin · Salamat · Mosalah · Other  
  - Only eligible drugs share cost with insurer  
  - Configurable coverage % in Settings  
  - Member ID required when insurance is applied
- Currency: **Iranian Rial (IRR)** across UI
- Credit baskets: group, search, mark paid

### Operations (`/api/v1/ops`)
- Cash shifts (open / close / variance)
- Prescriptions (noskhe)
- Controlled-drug logs
- Official invoice sequence numbers
- Stock & expiry alerts, reorder suggestions
- Goods receipt → batches + stock movements
- Drug interaction check
- Audit log (manager+)
- Accounting export, backup guidance

All ops routes are **role-gated** (staff / senior+ / manager+).

### Integrations (Settings → Integrations)
| Key | Purpose |
|-----|---------|
| `titak_api_key` / `titak_base_url` | Titak price API |
| `insurance_*_api_key` | Tamin / Salamat / Mosalah (your contracts) |
| `insurance_default_coverage_percent` | Default insurer share |

Secrets are stored server-side and **masked** in the UI.

### UX
- **i18n:** English + Persian (`next-intl`), synced message catalogs
- **Theme:** light / dark on login, setup, and dashboard
- **Language** switcher with icon
- Glass-style responsive UI

### Reliability
- Structured **Winston** logging + HTTP access logs with **request IDs**
- Unified **AppError** API responses (`code`, `message`, `requestId`)
- Frontend toasts with severity, dedupe, and optional request ref
- **CORS allowlist** via `CORS_ORIGIN`
- Baseline TypeORM migration for ops tables

See **[docs/ERROR_HANDLING_AND_LOGGING.md](./docs/ERROR_HANDLING_AND_LOGGING.md)**.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js, React, TypeScript, Tailwind, next-intl, next-themes, Zod |
| Backend | Express, TypeScript, TypeORM, Winston, Zod, JWT, bcrypt |
| Database | PostgreSQL 16 |
| Cache | Redis (rate limits; recommended in Compose) |
| Infra | Docker Compose, Nginx |

---

## Project Structure

```
pharmacy-management-system/
├── backend/
│   └── src/migrations/     # TypeORM migrations (BaselinePharmacyOps, …)
├── frontend/
├── docs/
│   ├── PROJECT_CATALOG.md
│   ├── ERROR_HANDLING_AND_LOGGING.md
│   └── NEW_FEATURES_2026-08.md
├── infrastructure/
│   ├── docker-compose.yaml
│   ├── nginx.conf
│   ├── .env.example
│   ├── README.md
│   └── deploy/
└── README.md
```

---

## Getting Started

### Prerequisites
Node.js ≥ 20 · Docker & Docker Compose · Git

### Clone & Docker

```bash
git clone https://github.com/yasin6606/pharmacy-management-system.git
cd pharmacy-management-system/infrastructure
cp .env.example .env
# set POSTGRES_PASSWORD, JWT_SECRET
# set CORS_ORIGIN to your browser origin(s), e.g. http://localhost
# first schema: TYPEORM_SYNCHRONIZE=true once, then false + migrations
docker compose up --build -d
```

| Access | URL |
|--------|-----|
| App | http://localhost |
| Health | http://localhost/health |
| API | http://localhost/api/v1 |

After first boot with synchronize, prefer:

```bash
# run migrations (from backend with DATABASE_URL pointing at Postgres)
cd ../backend && npm run migration:run
```

Rebuild after pulls:

```bash
docker compose up -d --build backend frontend
```

### Local dev

```bash
# backend → :3001
cd backend && npm install && npm run dev

# frontend → :3000  (API at http://localhost:3001/api/v1)
cd frontend && npm install && npm run dev
```

### First login
1. `/en/setup` or `/fa/setup` (theme + language on page)
2. Create manager → `/login`
3. Branches → drugs (Titak / insurance flags) → batches → sales

> **Note:** After logout, tokens are rejected server-side. After deploy/secret rotation, users must log in again.

---

## Environment

### Docker (`infrastructure/.env`)
See `.env.example`.

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_PASSWORD` | yes | DB password |
| `JWT_SECRET` | yes | Token signing secret |
| `JWT_EXPIRES_IN` | no | Default **`8h`** |
| `CORS_ORIGIN` | recommended | Comma-separated browser origins |
| `TYPEORM_SYNCHRONIZE` | bootstrap only | Prefer `false` + migrations in prod |
| `REDIS_URL` | no | Shared rate limits |
| `HTTP_PORT` | no | Nginx host port (default 80) |

### Backend extras
| Variable | Description |
|----------|-------------|
| `LOG_LEVEL` | `debug` · `info` · `warn` · `error` |
| `LOG_TO_FILES` | `true` to write rotating log files |
| `TITAK_API_KEY` | Optional env fallback; prefer Settings UI |

---

## API overview

Prefix: `/api/v1`

| Area | Paths |
|------|--------|
| Setup / Auth | `/setup`, `/auth` |
| Staff / Branches | `/employees`, `/branches` |
| Inventory | `/inventory/*`, `/inventory/catalog/stats` |
| Sales | `/sales`, `/sales/summary`, `/sales/batch`, basket pay |
| Customers | `/customers` |
| Ops | `/ops/shifts/*`, `/ops/prescriptions`, `/ops/barcode/:code`, `/ops/audit`, … |
| POS | `/integrations/pos/initiate`, `/confirm`, `/status/:ref` |
| Titak | `/integrations/titak/...` |
| Settings | `/settings/franchise`, `/settings/integrations` |
| Reporting / Loss | `/reporting`, `/loss-reports` |

Error shape:

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Drug not found",
  "requestId": "uuid"
}
```

---

## Security

- bcrypt · **JWT + live session check** · RBAC on sales and ops · login rate limiting (Redis when available)
- Logout sets `employee_sessions.logout_time` → subsequent API calls with that token return **401**
- Helmet · Zod validation · secrets via env / integration table (masked)
- **CORS** restricted by `CORS_ORIGIN` (production denies browser origins if unset)
- DB/Redis not published by default

---

## Documentation

| Doc | Content |
|-----|---------|
| **[docs/PROJECT_CATALOG.md](./docs/PROJECT_CATALOG.md)** | **Full technical & product catalog** |
| [docs/ERROR_HANDLING_AND_LOGGING.md](./docs/ERROR_HANDLING_AND_LOGGING.md) | Errors, request IDs, logging |
| [docs/NEW_FEATURES_2026-08.md](./docs/NEW_FEATURES_2026-08.md) | Gap features + security hardening notes |
| [infrastructure/README.md](./infrastructure/README.md) | Compose architecture |
| [infrastructure/deploy/oracle-cloud.md](./infrastructure/deploy/oracle-cloud.md) | Free ARM deploy |
| [backend/src/migrations/README.md](./backend/src/migrations/README.md) | Schema migrations policy |
| [backend/tests/README.md](./backend/tests/README.md) | Test suites |

---

## License

Private / proprietary unless stated otherwise by the author.

---

**Built for modern pharmacy operations — IRR, EN/FA, light/dark, observable APIs.**
