# Pharmacy Management System — Expanded Technical Catalog

**Version:** 1.2  
**Date:** 2026-08-27  
**Repository:** [yasin6606/pharmacy-management-system](https://github.com/yasin6606/pharmacy-management-system)  
**Author:** yasin  

In-repo companion to the PDF Technical Catalog. Covers product features, architecture, domain rules, data model, security (session-aware JWT), API, UX, deployment, and operations.

---

## Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [Product Goals & Domain Context](#2-product-goals--domain-context)
3. [Feature Catalog (Deep Dive)](#3-feature-catalog-deep-dive)
4. [System Architecture](#4-system-architecture)
5. [Technology Stack](#5-technology-stack-detailed)
6. [Backend Architecture & Modules](#6-backend-architecture--modules)
7. [Frontend Architecture & UX](#7-frontend-architecture--ux-design-system)
8. [Data Model & Persistence](#8-data-model-entities--persistence)
9. [Security & Access Control](#9-security-auth--access-control)
10. [Sales, Insurance, Credits & POS](#10-sales-insurance-credits--pos-logic)
11. [Integrations](#11-integrations-titak-insurance-pos)
12. [Errors & Observability](#12-error-handling-logging--observability)
13. [Infrastructure & Deployment](#13-infrastructure-docker--deployment)
14. [API Reference](#14-api-reference-expanded)
15. [Configuration](#15-configuration--environment-variables)
16. [Operational Runbook](#16-operational-runbook--incident-response)
17. [Testing](#17-testing-strategy--quality)
18. [Roadmap](#18-roadmap--extension-points)
19. [Glossary](#19-glossary--conventions)
20. [Appendix A — Repository Map](#appendix-a-repository-map)
21. [Appendix B — Example Workflows](#appendix-b-example-workflows)
22. [Changelog (catalog)](#22-changelog-catalog)

---

## 1. Executive Overview

The **Pharmacy Management System** is a production-oriented, multi-branch platform for pharmacies in Iran. It consolidates:

- Batch-level inventory and expiry control  
- Retail sales in **Iranian Rial (IRR)**  
- Patient insurance cost-sharing  
- Card-terminal (**POS**) settlement  
- Employee management with RBAC  
- Ops hub: shifts, prescriptions, controlled drugs, audit, goods receipt  
- Loss reporting, purchasing hooks, reporting exports  
- Integrations: Titak prices; insurer credential storage (Tamin, Salamat, Mosalah)

Architecture: Next.js client → Nginx → Express API → PostgreSQL, with Redis for shared rate limits. Design favors explicit domain rules, transactional stock safety, **session-revocable JWTs**, and observable failures (structured logs + `requestId`).

### Stakeholders

| Stakeholder | Primary needs | Key modules |
|-------------|---------------|-------------|
| Owner / manager | Policy, multi-branch, integrations, franchise | branches, settings, employees, reports, ops |
| Pharmacist / cashier | Fast sales, stock, insurance, POS | sales, inventory, POS |
| Accountant | Credits, revenue, exports | credits, reporting, summary |
| Warehouse staff | Transfers, batch intake, expiry | batches, transfer, goods receipt |
| Engineer / SRE | Deploy, logs, schema, scale | infra, logger, errorHandler, migrations |

### Design principles

- Domain correctness over convenience — stock must not go negative under concurrent cashiers  
- Money as whole IRR units (`numeric(18,0)` on sales and batch prices)  
- Insurance is opt-in per sale and eligibility-driven per drug line  
- Secrets stay server-side; UI only shows masks  
- One public network entry (Nginx); private data plane  
- Every API error is structured and correlatable via `requestId`  
- Logout must invalidate the session server-side

---

## 2. Product Goals & Domain Context

### Goals

- Single system of record for employees, branches, drugs, batches, movements, sales  
- Deterministic stock under concurrent sales/transfers (transactions + row locks)  
- Native IRR across dashboard, POS, credits, reports, batch prices  
- Insurance-aware checkout: only formulary-eligible drugs share cost  
- Operator-managed integration credentials without redeploy  
- Bilingual EN/FA and light/dark including pre-login screens  
- Container-first deployment (VPS / Oracle Cloud Always Free ARM)

### Iranian pharmacy domain

Pharmacies combine cash/card settlement with social insurance. Patients present booklet or electronic member IDs. Not every SKU is reimbursable → `insuranceEligible` + optional `insuranceCode` on drugs. Coverage % is configurable (default **70%**).

Titak (or similar) may supply regulated prices via `titakCode`. Card payments use an acquirer terminal; the POS module models **initiate → confirm** before finalizing the basket.

### Non-goals (current)

- Turnkey live insurer claim networks without pharmacy-supplied credentials  
- Multi-tenant SaaS isolation across unrelated companies  
- Native mobile apps (responsive web only)  
- Fully automated purchasing optimization

---

## 3. Feature Catalog (Deep Dive)

### 3.1 Platform bootstrap & identity

Fresh DB → public **Setup** creates first manager. JWT auth with **session row**; logout sets `logoutTime`. Roles:

| Role | Typical access |
|------|----------------|
| `junior` | Sell, view branch stock, basic ops (shifts, barcode, prescriptions) |
| `senior` | Broader stock ops, goods receipt, controlled logs, clinical upsert |
| `manager` | Staff, branches, settings, integrations, inventory, audit, backup |
| `accountant` | Cross-branch sales, credits, reports, audit, accounting export |

### 3.2 Inventory & catalog

- Drug master independent of physical stock  
- Batches bind drug + branch + qty + expiry + IRR prices (scale 0) + offer flag  
- Search: name, brand, company  
- **Safe delete**: blocked while any batch has count > 0  
- Catalog stats for dashboard KPIs  
- Titak price refresh when key + code configured  
- Near-expiry highlighting; background alert job  

### 3.3 Sales desk

Multi-tab baskets. Payment methods drive UX:

- **credit** → customer identity fields  
- **pos** → terminal initiate/confirm required before complete  
- **insurance** → provider + member ID; coverage on eligible lines only  

### 3.4 Credits & records

Credit sales `isPaid=false` until basket marked paid. Credits UI groups by `basketId`, search by name/phone, IRR totals.

### 3.5 Ops hub

Shifts, prescriptions, controlled logs, invoice numbers, barcode, alerts, reorder, goods receipt, interactions, audit, accounting export, backup info — all under `/api/v1/ops` with RBAC.

### 3.6 Loss, purchasing, reporting

Loss: create → approve/reject. Purchasing: suppliers, POs, OCR client hook. Reports: date/branch filters, CSV/PDF, IRR revenue.

### 3.7 UX product features

Glass design system, EN/FA locale prefix, theme + language on login/setup, severity toasts with optional `requestId`.

---

## 4. System Architecture

```
Client Browser
   │  HTTP :80 (HTTP_PORT)
   ▼
Nginx (edge)
   ├─ /api/* , /health  →  backend:3001
   └─ /*               →  frontend:3000
backend → postgres:5432
backend → redis:6379
backend → external APIs (Titak, insurers, POS)
```

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Presentation | `frontend/` | Routes, forms, design system, i18n |
| Application | `backend/src/modules` | Use-cases, validation, authz |
| Domain services | `*.service.ts` | Transactions, rules |
| Persistence | TypeORM | SQL, locks |
| Infrastructure | `core/`, Docker, Nginx | Logging, CORS, networking |

**Trust boundaries:** browser untrusted; authz on API; DB/Redis internal only; secrets never fully returned to UI.

**Scale:** stateless API + Redis rate limits; POS sessions currently in-process (roadmap: shared store).

---

## 5. Technology Stack (Detailed)

| Area | Choice | Rationale |
|------|--------|-----------|
| UI | Next.js App Router + React | Modern routing, React 19 |
| Language | TypeScript | Safer FE/BE refactors |
| Styling | Tailwind + CSS variables | Tokens; light/dark |
| i18n | next-intl | Locale routing + catalogs |
| Theme | next-themes | Class-based dark mode |
| Forms | RHF + Zod | Aligned validation |
| HTTP | Axios | Interceptors |
| API | Express | Middleware ecosystem |
| ORM | TypeORM | Transactions, pessimistic locks |
| DI | Awilix | Service wiring |
| Logging | Winston | Levels, JSON |
| Auth | bcryptjs + JWT + session table | Hash + revocable bearer |
| DB | PostgreSQL 16 | Concurrent writes |
| Cache | Redis 7 | Shared rate limits |
| Edge | Nginx | Path routing, future TLS |

---

## 6. Backend Architecture & Modules

### Bootstrap

`index.ts` → TypeORM init → `createApp()` → listen → expiration job → process error handlers.

### Middleware pipeline

`helmet` → **`cors(buildCorsOptions())`** → `json(1mb)` → `cookieParser` → **requestLogger** → routes → API 404 → **errorHandler**.

CORS reads `CORS_ORIGIN` (comma-separated). Production without list: browser origins denied.

### Modules

| Module | Paths | Responsibilities |
|--------|-------|------------------|
| setup | `POST /setup` | First manager |
| auth | `/auth/*` | Login, logout, me, sessions |
| employees | `/employees` | CRUD, roles, branch |
| branches | `/branches` | CRUD, franchise |
| inventory | `/inventory/*` | Drugs, batches, transfer, stats |
| sales | `/sales/*` | Batch sale, list, summary, pay |
| customers | `/customers` | Patient master |
| ops | `/ops/*` | Shifts, Rx, controlled, audit, … |
| settings | `/settings/*` | Franchise, integrations KV |
| titak / pos / insurance | `/integrations/*` | External systems |
| loss-reports | `/loss-reports` | Workflow |
| reporting | `/reporting/*` | Aggregations + export |
| purchasing | `/purchasing/*` | Suppliers, POs, OCR |

### Transactions

Inventory-affecting paths use `AppDataSource.transaction` and `pessimistic_write` on `DrugBatch`.

---

## 7. Frontend Architecture & UX Design System

### Routing

`app/[locale]/(auth)` — login, setup.  
`app/[locale]/(dashboard)` — operational screens + sidebar layout.

### Design system

CSS variables for light/dark; `.glass` / `.glass-strong`; medical teal primary; gold accent.

### Components

Button, Input, Select, Card, Table, Modal, Sidebar, Pagination, ErrorToast, Alert, Slider, ThemeToggle, LanguageSwitcher.

### State

`AuthContext`, `SalesTabsContext`, `ErrorContext`; `useApi`; `formatIRR`.

### Screens

Login, Setup, Dashboard, Drugs, Batches, Sales desk, Records, Credits, Customers, Operations, Reports, Employees, Branches, Loss reports, Settings.

---

## 8. Data Model, Entities & Persistence

| Entity | Key fields | Notes |
|--------|------------|-------|
| Employee | email, passwordHash, role, currentBranchId | Auth principal |
| EmployeeSession | login/logout, ip | **Revocation source of truth** |
| Branch | name, isWarehouse, hasFranchise | Org unit |
| Drug | name, brand, company, titakCode, insuranceEligible, barcode, isControlled | Catalog |
| DrugBatch | drugId, branchId, expirationDate, count, prices (scale 0), isOffer | Stock |
| StockMovement | type, quantity, branches, performer | Ledger |
| SaleTransaction | prices, paymentMethod, insurance*, patientShare, basketId, isPaid | Sale line |
| Customer | name, phone, nationalId, insurance* | Patients |
| CashShift / AuditLog / Prescription / ControlledDrugLog / … | Ops domain | |
| Settings / IntegrationSetting | key-value | Config & secrets |

**Money:** whole IRR; UI formats only.  
**Schema:** `TYPEORM_SYNCHRONIZE=false` in Compose; migration `BaselinePharmacyOps` for additive ops tables.

---

## 9. Security, Auth & Access Control

### Auth flow

1. Login → bcrypt verify → create `EmployeeSession` → JWT (`userId`, `role`, `branchId`, **`sessionId`**)  
2. Client stores token in `sessionStorage` → `Authorization: Bearer`  
3. Each request: verify JWT **and** load session with `logoutTime IS NULL`  
4. Logout → set `logoutTime` → further requests **401**

Default TTL: **`8h`** (`JWT_EXPIRES_IN`).

### Authorization

RBAC middleware on routes + service-level scoping. Ops roles:

| Gate | Roles |
|------|-------|
| staff | junior, senior, manager, accountant |
| seniorPlus | senior, manager, accountant |
| managerPlus | manager, accountant |
| managerOnly | manager |

### Mitigations

| Threat | Mitigation |
|--------|------------|
| Password at rest | bcrypt |
| Credential stuffing | Rate limit (Redis when available) |
| Stolen token after logout | Session table check |
| Injection | TypeORM params + Zod |
| Secret leakage | Masked integration GET |
| CSRF / random origins | CORS allowlist |
| DB exposure | Internal network only |

Helmet headers; TLS recommended at edge in production.

---

## 10. Sales, Insurance, Credits & POS Logic

### Batch sale algorithm

1. Validate items + branch  
2. Normalize insurance; require member ID if provider set  
3. Load coverage %  
4. Transaction: lock each batch; check stock/branch; decrement  
5. `lineTotal = round(price) * qty`  
6. Coverage only if `insuranceEligible`  
7. Insert sale + stock movement; controlled-drug log when applicable  
8. Optional franchise on first line  
9. Return `{ basketId, currency: 'IRR', insurance totals }`

### Insurance rule

> Non-eligible drugs never receive insurer share, even if a provider is selected.

### POS lifecycle

```
select POS → POST .../pos/initiate { amount: patientShare }
→ terminal payment → POST .../pos/confirm { approved: true }
→ POST /sales/batch { payment: { method: 'pos', posReference } }
```

### Credits

`method=credit` → `isPaid=false` until `PATCH .../basket/:id/pay`.

### Summaries

`GET /sales/summary` uses SQL aggregates (not page-sized client sums).

---

## 11. Integrations (Titak, Insurance, POS)

| Key | Purpose | Secret |
|-----|---------|--------|
| `titak_api_key` | Titak API | yes |
| `titak_base_url` | Base URL override | no |
| `insurance_*_api_key` | Tamin/Salamat/Mosalah | yes |
| `insurance_default_coverage_percent` | Default % | no |

Empty secret field on PUT = keep existing value. POS uses `BehMellatAdapter` sandbox until real SDK is wired.

---

## 12. Error Handling, Logging & Observability

See [ERROR_HANDLING_AND_LOGGING.md](./ERROR_HANDLING_AND_LOGGING.md).

Structured errors include `code`, `message`, `requestId`. Auth failures after logout return 401 with session messaging.

---

## 13. Infrastructure, Docker & Deployment

| Service | Published | Notes |
|---------|-----------|-------|
| postgres:16-alpine | no | volume `postgres_data` |
| redis:7-alpine | no | AOF, 64mb LRU |
| backend | no | JWT, CORS_ORIGIN, Redis |
| frontend | no | `NEXT_PUBLIC_API_URL=/api/v1` |
| nginx | **yes** `:HTTP_PORT` | only public entry |

```bash
cd infrastructure && cp .env.example .env
# POSTGRES_PASSWORD, JWT_SECRET, CORS_ORIGIN=http://localhost
docker compose up --build -d
```

Migrations: `backend/src/migrations/` — run with CLI DataSource after bootstrap.

Oracle Cloud ARM: `infrastructure/deploy/oracle-cloud.md`.

---

## 14. API Reference (Expanded)

Prefix: `/api/v1`. Success: `{ success: true, data }`.

### Auth & setup

| Method | Path | Description |
|--------|------|-------------|
| POST | `/setup` | First manager |
| POST | `/auth/login` | Token + user |
| POST | `/auth/logout` | Invalidate session |
| GET | `/auth/me` | Profile |

### Master data

| Method | Path | Description |
|--------|------|-------------|
| * | `/employees`, `/branches`, `/customers` | Staff, sites, patients |
| * | `/inventory/drugs`, `/batches` | Catalog & stock |
| POST | `/inventory/transfer` | Transfer |
| GET | `/inventory/catalog/stats` | KPIs |

### Sales & POS

| Method | Path | Description |
|--------|------|-------------|
| GET | `/sales`, `/sales/summary` | List / aggregates |
| POST | `/sales/batch` | Atomic basket sale |
| PATCH | `/sales/basket/:id/pay` | Mark credit paid |
| POST/GET | `/integrations/pos/*` | Terminal lifecycle |

### Ops (role-gated)

| Method | Path | Min role gate |
|--------|------|---------------|
| POST/GET | `/ops/shifts/*` | staff / senior for list |
| POST/GET | `/ops/prescriptions` | staff |
| GET | `/ops/barcode/:code` | staff |
| POST | `/ops/goods-receipts` | seniorPlus |
| GET/POST | `/ops/controlled-logs` | seniorPlus |
| GET | `/ops/audit` | managerPlus |
| GET | `/ops/accounting/export` | managerPlus |
| GET | `/ops/backup-info` | managerOnly |

### Settings & reports

| Method | Path | Description |
|--------|------|-------------|
| * | `/settings/*` | Franchise, integrations |
| * | `/reporting/*`, `/loss-reports` | Reports & loss |
| GET | `/health` | Liveness |

---

## 15. Configuration & Environment Variables

| Variable | Component | Required | Description |
|----------|-----------|----------|-------------|
| `POSTGRES_*` | Compose | password yes | DB bootstrap |
| `JWT_SECRET` | Backend | prod yes | Token signing |
| `JWT_EXPIRES_IN` | Backend | no | Default **`8h`** |
| `DATABASE_URL` | Backend | yes | Connection string |
| `REDIS_URL` | Backend | no | Rate limits |
| `TYPEORM_SYNCHRONIZE` | Backend | no | Bootstrap only |
| `TITAK_API_KEY` | Backend | no | Fallback |
| `LOG_LEVEL` | Backend | no | Log verbosity |
| `LOG_TO_FILES` | Backend | no | File transports |
| `CORS_ORIGIN` | Backend | recommended | Comma-separated origins |
| `NEXT_PUBLIC_API_URL` | Frontend | build | `/api/v1` in Compose |
| `HTTP_PORT` | Compose | no | Nginx host port |

---

## 16. Operational Runbook & Incident Response

### First boot checklist

1. Strong secrets in `.env` + `CORS_ORIGIN`  
2. Schema strategy (sync once **or** migrations)  
3. `docker compose up --build -d`  
4. `/health` OK  
5. Setup manager → branch → drugs/batches  
6. Optional integration keys  
7. Test cash + POS path  

### Common incidents

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| 401 after logout | Session invalidation | Expected — re-login |
| 401 after deploy | JWT secret / DB sessions | Re-login |
| CORS error | Origin not allowlisted | Update `CORS_ORIGIN` |
| Today sales = 0 | Summary/date bounds | Check `/sales/summary` |
| Stock error on sell | Concurrent / wrong branch | Read AppError; movements |
| POS stuck | No confirm | Approve before batch sale |
| Titak fails | Missing key/code | Settings + `titakCode` |

### Backup

Volume `postgres_data` and/or `pg_dump`. Redis can be empty-rebuilt.

---

## 17. Testing Strategy & Quality

- **Backend Jest:** 19 suites / 65+ tests including session-aware auth middleware  
- **Frontend Jest:** ApiError, useRole, ErrorContext, utils  
- **Gates:** TypeScript/webpack build, Docker image build  
- **Future:** Playwright E2E for basket + insurance + POS  

---

## 18. Roadmap & Extension Points

- Redis-backed POS sessions  
- Encrypt integration secrets at rest  
- httpOnly Secure cookies + CSRF strategy  
- Real acquirer SDK / live insurer adapters  
- TLS at Nginx  
- Sentry/APM  
- Playwright E2E  

---

## 19. Glossary & Conventions

| Term | Definition |
|------|------------|
| IRR | Iranian Rial |
| Batch | Stock lot at a branch |
| Basket | Sale lines sharing `basketId` |
| Session | `EmployeeSession` row; source of logout |
| Titak | External price service |
| Tamin / Salamat / Mosalah | Insurance funds |
| RBAC | Role-based access control |
| requestId | Log correlation id |
| AppError | Safe operational API error |
| POS | Card terminal flow |

**Conventions:** JSON camelCase; ISO dates in API; integer IRR in logic; locales `en`/`fa` always prefixed.

---

## Appendix A. Repository Map

```
pharmacy-management-system/
├── backend/src/core/          # errors, logger, middleware, config
├── backend/src/modules/       # domain modules (+ ops)
├── backend/src/migrations/    # TypeORM migrations
├── backend/tests/             # Jest
├── frontend/app/[locale]/     # routes
├── frontend/components/       # ui + forms
├── frontend/messages/         # en.json, fa.json
├── docs/                      # catalogs & guides
└── infrastructure/            # compose, nginx, deploy
```

---

## Appendix B. Example Workflows

### B.1 Go-live

Deploy → setup manager → Branch A → drug + batch (IRR) → test cash sale → verify dashboard & stock.

### B.2 POS with partial insurance

Eligible + non-eligible lines → Salamat + member ID → coverage only on eligible → POS initiate/confirm for patient share → complete.

### B.3 Logout security

User logs out → `logout_time` set → same Bearer token on next API call → **401 Session expired or logged out**.

---

## 22. Changelog (catalog)

| Version | Date | Notes |
|---------|------|-------|
| 1.1 | 2026-08-19 | Expanded catalog baseline |
| 1.2 | 2026-08-27 | Session invalidation, CORS, JWT 8h, ops RBAC, IRR scale 0, BaselinePharmacyOps migration |

---

*End of expanded catalog v1.2 — Pharmacy Management System.*
