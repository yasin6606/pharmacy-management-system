# Pharmacy Management System

Multi-branch pharmacy operations platform for Iranian pharmacies: inventory with batch expiry, POS sales in **IRR**, insurance-aware checkout, Titak price sync, role-based staff access, ops hub (shifts, prescriptions, controlled drugs, audit), Docker deployment, structured logging, and professional API error contracts.

**Author:** [yasin](https://github.com/yasin6606)  
**Repository:** [yasin6606/pharmacy-management-system](https://github.com/yasin6606/pharmacy-management-system)

📘 **Full catalog:** [docs/PROJECT_CATALOG.md](./docs/PROJECT_CATALOG.md) — complete technical & product reference.  
🔒 **Security:** [docs/SECURITY.md](./docs/SECURITY.md) — threat model, findings, hardening.

---

## Features

### Core
- Multi-branch warehouses & retail sites with stock transfers
- RBAC: `junior` · `senior` · `manager` · `accountant`
- Employee sessions with **server-side invalidation on logout** (JWT alone is not enough)
- Staff **isActive** flag; disabled accounts cannot authenticate
- JWT access tokens (default TTL **8h**) + bcrypt (cost **12**)
- Password policy: ≥8 characters, letter + digit
- First-run **setup** wizard for the manager account (rate-limited)

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
- Baseline TypeORM migration for ops tables + `employees.is_active`

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
│   └── src/migrations/     # TypeORM migrations
├── frontend/
├── docs/
│   ├── PROJECT_CATALOG.md
│   ├── SECURITY.md
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
cd ../backend && npm run migration:run
```

Rebuild after pulls:

```bash
docker compose up -d --build backend frontend
```

### Local dev

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

### First login
1. `/en/setup` or `/fa/setup` (theme + language on page)
2. Create manager → `/login`
3. Branches → drugs (Titak / insurance flags) → batches → sales

> **Note:** After logout, password change, role change, or account disable, tokens are rejected. After deploy/secret rotation, users must log in again.

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

---

## API overview

Prefix: `/api/v1` — Setup `/setup`, Auth `/auth`, Staff `/employees`, Inventory `/inventory/*`, Sales `/sales/*`, Customers `/customers`, Ops `/ops/*`, Integrations, Settings, Reporting.

---

## Security

- bcrypt (cost **12**) · **JWT + live session + DB role** · account **isActive** · login rate limiting (Redis when available)
- Logout / password change / role change / disable / delete → sessions closed → **401**
- Password policy: ≥8 chars, letter + digit
- Helmet · Zod validation · secrets via env / integration table (masked)
- **CORS** restricted by `CORS_ORIGIN`; Nginx CSP + security headers
- `trust proxy` for correct client IP behind Nginx
- DB/Redis not published by default

Full write-up: **[docs/SECURITY.md](./docs/SECURITY.md)**.

---

## Documentation

| Doc | Content |
|-----|---------|
| **[docs/PROJECT_CATALOG.md](./docs/PROJECT_CATALOG.md)** | **Full technical & product catalog** |
| **[docs/SECURITY.md](./docs/SECURITY.md)** | Threat model, findings, hardening |
| [docs/ERROR_HANDLING_AND_LOGGING.md](./docs/ERROR_HANDLING_AND_LOGGING.md) | Errors, request IDs, logging |
| [docs/NEW_FEATURES_2026-08.md](./docs/NEW_FEATURES_2026-08.md) | Gap features + security notes |
| [infrastructure/README.md](./infrastructure/README.md) | Compose architecture |
| [infrastructure/deploy/oracle-cloud.md](./infrastructure/deploy/oracle-cloud.md) | Free ARM deploy |
| [backend/src/migrations/README.md](./backend/src/migrations/README.md) | Schema migrations policy |
| [backend/tests/README.md](./backend/tests/README.md) | Test suites |

---

## License

Private / proprietary unless stated otherwise by the author.

---

**Built for modern pharmacy operations — IRR, EN/FA, light/dark, observable APIs.**
