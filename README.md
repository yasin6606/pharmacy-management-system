# Pharmacy Management System

A multi-branch pharmacy operations platform designed for real-world use in Iran: inventory with batch expiry, POS sales in **IRR**, role-based staff access, loss reporting, purchasing, insurance-aware checkout, Titak price sync, and Docker-based deployment.

**Author:** [yasin](https://github.com/yasin6606)  
**Repository:** [yasin6606/pharmacy-management-system](https://github.com/yasin6606/pharmacy-management-system)

---

## Features

### Core
- **Multi-branch** warehouses and retail sites with stock transfers
- **RBAC:** `junior` · `senior` · `manager` · `accountant`
- Employee sessions, branch assignment history, JWT + bcrypt auth
- First-run **setup** to create the manager account

### Inventory
- Drug catalog with search, edit, and safe delete (blocked while stock remains)
- Batch tracking: expiry, quantity, offer flag, purchase/selling price
- Stock movements: transfer · sale · (adjustment path)
- **Titak code** per drug for external price updates
- **Insurance eligibility** and formulary code per drug
- Catalog stats and branch-level stock views

### Sales & POS
- Multi-tab patient baskets
- Payment: cash · transfer · POS · credit
- **Patient insurance** at checkout: Tamin · Salamat · Mosalah · Other
  - Only **insurance-eligible** lines share cost with the insurer
  - Configurable default coverage % (Settings)
  - Member ID required when insurance is applied
- Currency display: **Iranian Rial (IRR)**

### Operations
- Loss reports (create → approve/reject)
- Purchasing, suppliers, OCR hooks
- Reporting with CSV/PDF export paths
- Franchise fee per branch (optional)

### Integrations (Settings → Integrations)
| Key | Purpose |
|-----|---------|
| `titak_api_key` / `titak_base_url` | Titak drug price API |
| `insurance_tamin_api_key` | تامین اجتماعی |
| `insurance_salamat_api_key` | سلامت |
| `insurance_mosalah_api_key` | نیروهای مسلح |
| `insurance_default_coverage_percent` | Default insurer share (e.g. `70`) |

Secrets are stored server-side and **masked** in the UI. Leave a secret field empty when saving to keep the existing value.

> Iranian insurer and Titak keys are issued under your pharmacy contracts. This project does **not** ship third-party API keys.

### UX
- **i18n:** English + Persian (`next-intl`, always-locale prefix)
- **Theme:** light / dark (`next-themes`) — available on **login**, **setup**, and the dashboard sidebar
- Glass-style UI, responsive layout, role-gated navigation

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS, next-intl, next-themes, Zod, react-hook-form |
| Backend | Express, TypeScript, TypeORM, Awilix, Zod, Winston, JWT, bcrypt |
| Database | PostgreSQL 16 |
| Cache | Redis (optional, login rate limits) |
| Infrastructure | Docker Compose, Nginx reverse proxy |

---

## Project Structure

```
pharmacy-management-system/
├── backend/                 # Express API
├── frontend/                # Next.js app
├── infrastructure/
│   ├── docker-compose.yaml
│   ├── nginx.conf
│   ├── .env.example
│   └── deploy/              # Oracle Cloud bootstrap notes/scripts
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 20 (22 recommended)
- Docker & Docker Compose
- Git

### Clone

```bash
git clone https://github.com/yasin6606/pharmacy-management-system.git
cd pharmacy-management-system
```

### Run with Docker (recommended)

```bash
cd infrastructure
cp .env.example .env
# Set strong POSTGRES_PASSWORD and JWT_SECRET
# For first schema create: TYPEORM_SYNCHRONIZE=true

docker compose up --build -d
```

| Service | URL |
|---------|-----|
| App (Nginx) | http://localhost |
| Health | http://localhost/health |
| API (via proxy) | http://localhost/api/v1 |

Postgres and Redis stay internal by default.

#### Rebuild only frontend or backend after pulls

```bash
cd infrastructure
docker compose up -d --build frontend
docker compose up -d --build backend
```

### Local development (without full Docker)

**Backend**

```bash
cd backend
npm install
npm run dev   # :3001
```

**Frontend**

```bash
cd frontend
# NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
npm install
npm run dev   # :3000
```

### First-time setup

1. Open `/en/setup` or `/fa/setup` (language/theme toggles are on the page)
2. Create the manager account
3. Log in at `/en/login` or `/fa/login`
4. Add branches, drugs (Titak code + insurance flags), batches, then sell

---

## Environment Variables

### Docker (`infrastructure/.env`)

Copy from `.env.example`. Required: `POSTGRES_PASSWORD`, `JWT_SECRET`.

### Backend

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL URL |
| `JWT_SECRET` | Required in production |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `REDIS_URL` | Optional shared rate limits |
| `TYPEORM_SYNCHRONIZE` | `true` only for local/bootstrap |
| `TITAK_API_KEY` | Optional env fallback; prefer Settings UI |

### Frontend

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | `/api/v1` behind Nginx, or full URL in local dev |

---

## API Overview

Prefix: `/api/v1`

| Module | Base path |
|--------|-----------|
| Setup | `/setup` |
| Auth | `/auth` |
| Employees | `/employees` |
| Branches | `/branches` |
| Inventory | `/inventory` (drugs, batches, catalog/stats, transfer) |
| Sales | `/sales`, `/sales/summary`, `/sales/batch` |
| Loss reports | `/loss-reports` |
| Reporting | `/reporting` |
| Purchasing | `/purchasing` |
| Settings | `/settings/franchise`, `/settings/integrations` |
| Titak | `/integrations/titak/...` |

Health: `GET /health`

---

## Scripts

**Backend:** `npm run dev` · `build` · `start` · `test` · `migration:run`  
**Frontend:** `npm run dev` · `build` · `start` · `test`

---

## Security Notes

- bcrypt passwords, JWT + RBAC
- Login rate limiting (Redis when available)
- Helmet; Zod validation on inputs
- Integration secrets masked in list APIs
- DB/Redis not published on the host by default

---

## License

Private / proprietary unless stated otherwise by the author.

---

**Built for modern pharmacy operations in IRR, with EN/FA and light/dark themes.**
