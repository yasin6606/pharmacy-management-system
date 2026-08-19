# Pharmacy Management System

Multi-branch pharmacy operations platform for Iranian pharmacies: inventory with batch expiry, POS sales in **IRR**, insurance-aware checkout, Titak price sync, role-based staff access, loss reporting, Docker deployment, structured logging, and professional API error contracts.

**Author:** [yasin](https://github.com/yasin6606)  
**Repository:** [yasin6606/pharmacy-management-system](https://github.com/yasin6606/pharmacy-management-system)

---

## Features

### Core
- Multi-branch warehouses & retail sites with stock transfers
- RBAC: `junior` · `senior` · `manager` · `accountant`
- Employee sessions, branch history, JWT + bcrypt
- First-run **setup** wizard for the manager account

### Inventory
- Drug catalog: search, create, edit, safe delete (blocked while stock remains)
- Batches: expiry, quantity, offer flag, purchase/selling price (IRR)
- Stock movements: transfer · sale
- **Titak code** + **Update price** via Titak API (key in Settings)
- **Insurance eligible** flag + formulary code per drug
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

### Operations
- Loss reports (create → approve/reject)
- Purchasing / suppliers / OCR hooks
- Sales reporting + CSV/PDF export
- Optional franchise fee per branch

### Integrations (Settings → Integrations)
| Key | Purpose |
|-----|---------|
| `titak_api_key` / `titak_base_url` | Titak price API |
| `insurance_*_api_key` | Tamin / Salamat / Mosalah (your contracts) |
| `insurance_default_coverage_percent` | Default insurer share |

Secrets are stored server-side and **masked** in the UI.

### UX
- **i18n:** English + Persian (`next-intl`)
- **Theme:** light / dark on login, setup, and dashboard
- **Language** switcher with icon
- Glass-style responsive UI

### Reliability
- Structured **Winston** logging + HTTP access logs with **request IDs**
- Unified **AppError** API responses (`code`, `message`, `requestId`)
- Frontend toasts with severity, dedupe, and optional request ref
- API 404 handler; Zod validation errors

See **[docs/ERROR_HANDLING_AND_LOGGING.md](./docs/ERROR_HANDLING_AND_LOGGING.md)**.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js, React, TypeScript, Tailwind, next-intl, next-themes, Zod |
| Backend | Express, TypeScript, TypeORM, Winston, Zod, JWT, bcrypt |
| Database | PostgreSQL 16 |
| Cache | Redis (optional rate limits) |
| Infra | Docker Compose, Nginx |

---

## Project Structure

```
pharmacy-management-system/
├── backend/
├── frontend/
├── docs/
│   └── ERROR_HANDLING_AND_LOGGING.md
├── infrastructure/
│   ├── docker-compose.yaml
│   ├── nginx.conf
│   ├── .env.example
│   ├── README.md
│   └── deploy/          # Oracle Cloud bootstrap & update
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
# first schema: TYPEORM_SYNCHRONIZE=true
docker compose up --build -d
```

| Access | URL |
|--------|-----|
| App | http://localhost |
| Health | http://localhost/health |
| API | http://localhost/api/v1 |

Rebuild after pulls:

```bash
docker compose up -d --build backend frontend
```

### Local dev

```bash
# backend → :3001
cd backend && npm install && npm run dev

# frontend → :3000  (NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1)
cd frontend && npm install && npm run dev
```

### First login
1. `/en/setup` or `/fa/setup` (theme + language on page)
2. Create manager → `/login`
3. Branches → drugs (Titak / insurance flags) → batches → sales

---

## Environment

### Docker (`infrastructure/.env`)
See `.env.example`. Required: `POSTGRES_PASSWORD`, `JWT_SECRET`.

### Backend extras
| Variable | Description |
|----------|-------------|
| `LOG_LEVEL` | `debug` · `info` · `warn` · `error` |
| `LOG_TO_FILES` | `true` to write rotating log files |
| `TITAK_API_KEY` | Optional env fallback; prefer Settings UI |
| `TYPEORM_SYNCHRONIZE` | Bootstrap only |

---

## API overview

Prefix: `/api/v1`

| Area | Paths |
|------|--------|
| Setup / Auth | `/setup`, `/auth` |
| Staff / Branches | `/employees`, `/branches` |
| Inventory | `/inventory/*`, `/inventory/catalog/stats` |
| Sales | `/sales`, `/sales/summary`, `/sales/batch`, basket pay |
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

- bcrypt · JWT · RBAC · rate limiting (Redis when available)
- Helmet · Zod validation · secrets via env / integration table (masked)
- DB/Redis not published by default

---

## Documentation

| Doc | Content |
|-----|---------|
| [docs/ERROR_HANDLING_AND_LOGGING.md](./docs/ERROR_HANDLING_AND_LOGGING.md) | Errors, request IDs, logging |
| [infrastructure/README.md](./infrastructure/README.md) | Compose architecture |
| [infrastructure/deploy/oracle-cloud.md](./infrastructure/deploy/oracle-cloud.md) | Free ARM deploy |

---

## License

Private / proprietary unless stated otherwise by the author.

---

**Built for modern pharmacy operations — IRR, EN/FA, light/dark, observable APIs.**
