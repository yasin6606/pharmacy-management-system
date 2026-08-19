# Pharmacy Management System — Expanded Technical Catalog

**Version:** 1.1 Expanded  
**Date:** 2026-08-19  
**Repository:** [yasin6606/pharmacy-management-system](https://github.com/yasin6606/pharmacy-management-system)  
**Author:** yasin  

This document is the in-repo, searchable companion to the **PDF Technical Catalog**. It covers product features, architecture, domain rules, data model, security, API, UX, deployment, and operations in depth.

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

---

## 1. Executive Overview

The **Pharmacy Management System** is a production-oriented, multi-branch platform for pharmacies in Iran. It consolidates:

- Batch-level inventory and expiry control  
- Retail sales in **Iranian Rial (IRR)**  
- Patient insurance cost-sharing  
- Card-terminal (**POS**) settlement  
- Employee management with RBAC  
- Loss reporting, purchasing hooks, reporting exports  
- Integrations: Titak prices; insurer credential storage (Tamin, Salamat, Mosalah)

Architecture: Next.js client → Nginx → Express API → PostgreSQL, with optional Redis for shared rate limits. Design favors explicit domain rules, transactional stock safety, and observable failures (structured logs + `requestId`).

### Stakeholders

| Stakeholder | Primary needs | Key modules |
|-------------|---------------|-------------|
| Owner / manager | Policy, multi-branch, integrations, franchise | branches, settings, employees, reports |
| Pharmacist / cashier | Fast sales, stock, insurance, POS | sales, inventory, POS |
| Accountant | Credits, revenue, exports | credits, reporting, summary |
| Warehouse staff | Transfers, batch intake, expiry | batches, transfer |
| Engineer / SRE | Deploy, logs, schema, scale | infra, logger, errorHandler |

### Design principles

- Domain correctness over convenience — stock must not go negative under concurrent cashiers  
- Money as whole IRR units (rounded integers)  
- Insurance is opt-in per sale and eligibility-driven per drug line  
- Secrets stay server-side; UI only shows masks  
- One public network entry (Nginx); private data plane  
- Every API error is structured and correlatable via `requestId`

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

Fresh DB → public **Setup** creates first manager. JWT auth; `EmployeeSession` for audit. Roles:

| Role | Typical access |
|------|----------------|
| `junior` | Sell, view branch stock |
| `senior` | Broader stock ops where gated |
| `manager` | Staff, branches, settings, integrations, inventory |
| `accountant` | Cross-branch sales, credits, reports |

### 3.2 Inventory & catalog

- Drug master independent of physical stock  
- Batches bind drug + branch + qty + expiry + IRR prices + offer flag  
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

Credit sales `isPaid=false` until basket marked paid. Credits UI groups by `basketId`, search by name/phone, IRR totals. Records list history with filters for privileged roles.

### 3.5 Loss, purchasing, reporting

Loss: create → approve/reject. Purchasing: suppliers, POs, OCR client hook. Reports: date/branch filters, CSV/PDF, IRR revenue.

### 3.6 UX product features

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
| Infrastructure | `core/`, Docker, Nginx | Logging, networking |

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
| Auth | bcryptjs + JWT | Hash + bearer |
| DB | PostgreSQL 16 | Concurrent writes |
| Cache | Redis 7 | Shared rate limits |
| Edge | Nginx | Path routing, future TLS |

---

## 6. Backend Architecture & Modules

### Bootstrap

`index.ts` → TypeORM init → `createApp()` → listen → expiration job → `unhandledRejection` / `uncaughtException` handlers.

### Middleware pipeline

`helmet` → `cors` → `json(1mb)` → `cookieParser` → **requestLogger** → routes → API 404 → **errorHandler**.

### Modules

| Module | Paths | Responsibilities |
|--------|-------|------------------|
| setup | `POST /setup` | First manager |
| auth | `/auth/*` | Login, me, password, sessions |
| employees | `/employees` | CRUD, roles, branch |
| branches | `/branches` | CRUD, franchise |
| inventory | `/inventory/*` | Drugs, batches, transfer, stats |
| sales | `/sales/*` | Batch sale, list, summary, pay |
| settings | `/settings/*` | Franchise, integrations KV |
| titak | `/integrations/titak/*` | External prices |
| pos | `/integrations/pos/*` | Terminal lifecycle |
| insurance | `/integrations/insurance/*` | Adapter hooks |
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

Button, Input, Select, Card, Table, Modal, Sidebar, Pagination, ErrorToast, ThemeToggle, LanguageSwitcher.

### State

`AuthContext`, `SalesTabsContext`, `ErrorContext`; `useApi`; `formatIRR`.

### Screens

Login, Setup, Dashboard, Drugs, Batches, Sales desk, Records, Credits, Reports, Employees, Branches, Loss reports, Settings.

---

## 8. Data Model, Entities & Persistence

| Entity | Key fields | Notes |
|--------|------------|-------|
| Employee | email, passwordHash, role, currentBranchId | Auth principal |
| EmployeeSession | login/logout, ip | Audit |
| Branch | name, isWarehouse, hasFranchise | Org unit |
| Drug | name, brand, company, titakCode, insuranceEligible, insuranceCode | Catalog |
| DrugBatch | drugId, branchId, expirationDate, count, prices, isOffer | Stock |
| StockMovement | type, quantity, branches, performer | Ledger |
| SaleTransaction | prices, paymentMethod, insurance*, patientShare, basketId, isPaid | Sale line |
| Settings | key, numeric value | franchise_amount |
| IntegrationSetting | key, string value | Secrets & URLs |
| LossReport | status, review fields | Workflow |
| Supplier / PurchaseOrder | purchasing domain | |

**Money:** whole IRR; UI formats only.  
**Schema:** `TYPEORM_SYNCHRONIZE=false` in Compose; migrations preferred in production.

---

## 9. Security, Auth & Access Control

### Auth flow

Login → bcrypt verify → JWT (userId, role, branchId) → session row → client `sessionStorage` → `Authorization: Bearer`.

### Authorization

RBAC middleware + service-level scoping (non-managers limited to own sales/branch).

### Mitigations

| Threat | Mitigation |
|--------|------------|
| Password at rest | bcrypt |
| Credential stuffing | Rate limit |
| Injection | TypeORM params + Zod |
| Secret leakage | Masked integration GET |
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
7. Insert sale + stock movement  
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

`GET /sales/summary` uses SQL `SUM`/`COUNT` (not page-sized client sums).

---

## 11. Integrations (Titak, Insurance, POS)

| Key | Purpose | Secret |
|-----|---------|--------|
| `titak_api_key` | Titak API | yes |
| `titak_base_url` | Base URL override | no |
| `insurance_*_api_key` | Tamin/Salamat/Mosalah | yes |
| `insurance_default_coverage_percent` | Default % | no |
| `pos_terminal_id` | Default terminal | no |

Empty secret field on PUT = keep existing value. Titak updates `lastPriceUpdateDate` and batch selling prices. POS uses `BehMellatAdapter` stub until real SDK is wired.

---

## 12. Error Handling, Logging & Observability

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "…",
  "details": [{ "path": "email", "message": "…" }],
  "requestId": "uuid"
}
```

| Source | HTTP | code |
|--------|------|------|
| ZodError | 400 | VALIDATION_ERROR |
| AppError | varies | err.code |
| QueryFailedError | 400 | DATABASE_ERROR |
| JWT | 401 | UNAUTHORIZED |
| Bad JSON | 400 | BAD_REQUEST |
| Unknown | 500 | INTERNAL_ERROR |

**Logging:** Winston + `requestLogger` (`durationMs`, `requestId`, `userId`).  
**Frontend:** `ApiError`, `clientLog`, toast dedupe, severity.  
**Playbook:** toast/header `requestId` → `docker compose logs backend | grep <id>`.

See [ERROR_HANDLING_AND_LOGGING.md](./ERROR_HANDLING_AND_LOGGING.md).

---

## 13. Infrastructure, Docker & Deployment

| Service | Published | Notes |
|---------|-----------|-------|
| postgres:16-alpine | no | volume `postgres_data` |
| redis:7-alpine | no | AOF, 64mb LRU |
| backend | no | depends on DB/Redis healthy |
| frontend | no | `NEXT_PUBLIC_API_URL=/api/v1` |
| nginx | **yes** `:HTTP_PORT` | only public entry |

```bash
cd infrastructure && cp .env.example .env
docker compose up --build -d
docker compose up -d --build backend frontend
docker compose logs -f backend
```

Oracle Cloud ARM: `infrastructure/deploy/oracle-cloud.md`.

---

## 14. API Reference (Expanded)

Prefix: `/api/v1`. Success: `{ success: true, data }`.

### Auth & setup

| Method | Path | Description |
|--------|------|-------------|
| POST | `/setup` | First manager |
| POST | `/auth/login` | Token + user |
| GET | `/auth/me` | Profile |
| PUT | `/auth/change-password` | Password change |

### Master data

| Method | Path | Description |
|--------|------|-------------|
| * | `/employees`, `/branches` | Staff & sites |
| * | `/inventory/drugs`, `/batches` | Catalog & stock |
| POST | `/inventory/transfer` | Transfer |
| GET | `/inventory/catalog/stats` | KPIs |
| GET | `/inventory/branches/:id/inventory` | Branch stock |

### Sales & POS

| Method | Path | Description |
|--------|------|-------------|
| GET | `/sales` | Paginated lines |
| GET | `/sales/summary` | Aggregates |
| POST | `/sales/batch` | Atomic basket sale |
| PATCH | `/sales/basket/:id/pay` | Mark credit paid |
| POST | `/integrations/pos/initiate` | Start POS |
| POST | `/integrations/pos/confirm` | Approve/decline |
| GET | `/integrations/pos/status/:ref` | Status |

### Settings & reports

| Method | Path | Description |
|--------|------|-------------|
| * | `/settings/franchise`, `/settings/integrations` | Config |
| POST | `/integrations/titak/update-price/:drugId` | Titak |
| GET | `/reporting/sales`, `.../export` | Reports |
| * | `/loss-reports` | Loss workflow |
| GET | `/health` | Liveness |

---

## 15. Configuration & Environment Variables

| Variable | Component | Required | Description |
|----------|-----------|----------|-------------|
| `POSTGRES_*` | Compose | password yes | DB bootstrap |
| `JWT_SECRET` | Backend | prod yes | Token signing |
| `JWT_EXPIRES_IN` | Backend | no | Default `7d` |
| `DATABASE_URL` | Backend | yes | Connection string |
| `REDIS_URL` | Backend | no | Rate limits |
| `TYPEORM_SYNCHRONIZE` | Backend | no | Bootstrap only |
| `TITAK_API_KEY` | Backend | no | Fallback |
| `LOG_LEVEL` | Backend | no | Log verbosity |
| `LOG_TO_FILES` | Backend | no | File transports |
| `CORS_ORIGIN` | Backend | no | Browser origin |
| `NEXT_PUBLIC_API_URL` | Frontend | build | `/api/v1` in Compose |
| `HTTP_PORT` | Compose | no | Nginx host port |

---

## 16. Operational Runbook & Incident Response

### First boot checklist

1. Strong secrets in `.env`  
2. Schema strategy (sync once or migrations)  
3. `docker compose up --build -d`  
4. `/health` OK  
5. Setup manager → branch → drugs/batches  
6. Optional integration keys  
7. Test cash + POS path  

### Common incidents

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| Image `npm ci` fail | Lockfile drift | Refresh lock / install fallback |
| Today sales = 0 | Summary/date bounds | Check `/sales/summary` |
| Stock error on sell | Concurrent / wrong branch | Read AppError; movements |
| 401 loops | Expired JWT / secret rotate | Re-login |
| POS stuck | No confirm | Approve before batch sale |
| Titak fails | Missing key/code | Settings + `titakCode` |

### Backup

Volume `postgres_data` and/or `pg_dump`. Redis can be empty-rebuilt.

---

## 17. Testing Strategy & Quality

- **Backend Jest:** services, middleware, utils  
- **Frontend Jest:** ApiError, useRole, ErrorContext, utils  
- **Gates:** TypeScript build, Docker image build, manual go-live checklist  
- **Future:** Playwright E2E for basket + insurance + POS  

---

## 18. Roadmap & Extension Points

- Formal migrations + CI checks  
- Redis-backed POS sessions  
- Real acquirer SDK  
- Live insurer adapters  
- TLS + strict CORS  
- Sentry/APM  
- Playwright E2E  
- Min-stock alerts / purchase suggestions  
- Finer permission matrix if needed  

---

## 19. Glossary & Conventions

| Term | Definition |
|------|------------|
| IRR | Iranian Rial |
| Batch | Stock lot at a branch |
| Basket | Sale lines sharing `basketId` |
| Franchise fee | Optional fee when `hasFranchise` |
| Titak | External price service |
| Tamin / Salamat / Mosalah | Insurance funds |
| RBAC | Role-based access control |
| requestId | Log correlation id |
| AppError | Safe operational API error |
| POS | Card terminal flow |
| Pessimistic lock | DB row lock for safe concurrent updates |

**Conventions:** JSON camelCase; ISO dates in API; integer IRR in logic; locales `en`/`fa` always prefixed.

---

## Appendix A. Repository Map

```
pharmacy-management-system/
├── backend/src/core/          # errors, logger, middleware, config
├── backend/src/modules/       # domain modules
├── backend/tests/             # Jest
├── frontend/app/[locale]/     # routes
├── frontend/components/       # ui + forms
├── frontend/context|hooks|lib
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

### B.3 Credit collection

Credit sale with customer phone → Credits page → Mark as paid → verify badge.

---

*End of expanded catalog v1.1 — Pharmacy Management System.*
