# Pharmacy Management System — Complete Technical Catalog

**Version:** 1.0  
**Date:** 2026-08-19  
**Repository:** [yasin6606/pharmacy-management-system](https://github.com/yasin6606/pharmacy-management-system)  
**Author:** yasin  

> A professional PDF edition of this catalog is distributed with releases / local `docs/Pharmacy_Management_System_Catalog.pdf` (generate or download from the project documentation package).

---

## Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [Product Goals & Domain Context](#2-product-goals--domain-context)
3. [Feature Catalog](#3-feature-catalog-complete)
4. [System Architecture](#4-system-architecture)
5. [Technology Stack](#5-technology-stack)
6. [Backend Architecture & Modules](#6-backend-architecture--modules)
7. [Frontend Architecture & UX Design](#7-frontend-architecture--ux-design)
8. [Data Model & Persistence](#8-data-model--persistence)
9. [Security & Access Control](#9-security--access-control)
10. [Sales, Insurance & POS Logic](#10-sales-insurance--pos-logic)
11. [Integrations](#11-integrations)
12. [Error Handling & Observability](#12-error-handling--observability)
13. [Infrastructure & Deployment](#13-infrastructure--deployment)
14. [API Reference Summary](#14-api-reference-summary)
15. [Configuration & Environment](#15-configuration--environment)
16. [Operational Runbook](#16-operational-runbook)
17. [Testing Strategy](#17-testing-strategy)
18. [Roadmap](#18-roadmap--extension-points)
19. [Glossary](#19-glossary)

---

## 1. Executive Overview

The **Pharmacy Management System** is a full-stack, multi-branch platform for real-world Iranian pharmacy operations. It unifies:

- Batch-level inventory and expiry control  
- Point-of-sale in **Iranian Rial (IRR)**  
- Patient insurance cost-sharing  
- Card-terminal (POS) payment workflows  
- Role-based staff access  
- Loss reporting, purchasing hooks, reporting exports  
- External integrations (Titak prices; Tamin / Salamat / Mosalah keys)

Priorities: **operational safety** (stock locks, safe delete, credits), **observability** (structured logs, request IDs), **deployability** (Docker Compose, Nginx, PostgreSQL, Redis).

### Stakeholders

| Role | Interests |
|------|-----------|
| Owner / manager | Branches, franchise, integrations |
| Pharmacist / cashier | Sales, insurance, POS, stock |
| Accountant | Credits, reports, revenue |
| Engineer / operator | Deploy, monitor, extend |

---

## 2. Product Goals & Domain Context

### Goals

- Single system of record for drugs, batches, branches, sales, staff  
- Correct stock under concurrent sales (pessimistic locks)  
- Native IRR UX  
- Insurance only on eligible formulary drugs  
- Integration keys configurable without redeploy  
- EN/FA + light/dark including auth screens  
- One published HTTP port; internal data plane  

### Domain

Iranian pharmacies work with social funds, member IDs, regulated price sources (Titak), and acquirer POS terminals. This product models those concepts; live insurer APIs remain contract adapters (no bundled third-party keys).

---

## 3. Feature Catalog (Complete)

### Core
- Multi-branch (retail / warehouse)  
- Setup wizard → first manager  
- JWT + sessions; branch history  
- Roles: `junior` · `senior` · `manager` · `accountant`  

### Inventory
- Drug master + `titakCode`, `insuranceEligible`, `insuranceCode`  
- Search, paginate, safe delete  
- Batches: expiry, stock, offer, IRR prices  
- Transfers + stock movements  
- Expiry alerts; catalog stats  

### Sales & POS
- Multi-tab patient baskets  
- Payments: cash · transfer · POS · credit  
- POS: initiate → confirm → complete (`posReference`)  
- Insurance: Tamin / Salamat / Mosalah / other + member ID  
- Per-line coverage & patient share  
- Franchise fee when enabled  
- Summary KPIs; credits mark-paid  

### Operations
- Loss reports workflow  
- Purchasing / OCR hooks  
- Reports + CSV/PDF  
- Settings: franchise + masked integration secrets  

### UX
- Glass design system (teal / gold)  
- i18n EN/FA; theme toggle; language icon  
- Severity toasts + requestId  

### Reliability
- Winston + HTTP access logs  
- AppError contract  
- Process-level error handlers  
- Compose healthchecks  

---

## 4. System Architecture

```
Browser → Nginx:80
            ├─ /api/v1/* → backend:3001
            ├─ /health   → backend:3001
            └─ /*        → frontend:3000

Internal: postgres:5432 · redis:6379 · backend · frontend
```

| Component | Responsibility |
|-----------|----------------|
| Next.js frontend | UI, i18n, themes, API client |
| Express backend | REST, auth, domain, integrations |
| PostgreSQL 16 | System of record |
| Redis 7 | Shared rate limits |
| Nginx | Edge routing / future TLS |

---

## 5. Technology Stack

| Layer | Stack |
|-------|-------|
| Frontend | Next.js, React, TS, Tailwind, next-intl, next-themes, RHF, Zod, Axios |
| Backend | Express, TS, TypeORM, Awilix, Zod, Winston, JWT, bcrypt, ioredis |
| Data | PostgreSQL 16, Redis 7 |
| Infra | Docker multi-stage, Compose, Nginx 1.27 |

---

## 6. Backend Architecture & Modules

### Core

| Area | Behavior |
|------|----------|
| AppError | code, details, factories |
| errorHandler | Zod / JWT / DB / 500 mapping |
| requestLogger | x-request-id, durationMs |
| logger | LOG_LEVEL, optional files |
| auth / rbac | Bearer JWT, requireRole |

### Modules

`setup`, `auth`, `employees`, `branches`, `inventory`, `sales`, `settings`, `integrations/{titak,pos,insurance}`, `loss-reports`, `reporting`, `purchasing`.

### Concurrency

Sales/transfers: DB transaction + `pessimistic_write` on `DrugBatch`.

---

## 7. Frontend Architecture & UX Design

- Tokens: medical teal, gold accent, glass panels  
- Role-gated sidebar  
- Locale-prefixed routes; theme on auth  
- `lib/api.ts` + `useApi` + ErrorContext/Toast  
- Screens: dashboard, inventory, sales, credits, reports, settings  

---

## 8. Data Model & Persistence

Key entities: `Employee`, `Branch`, `Drug`, `DrugBatch`, `StockMovement`, `SaleTransaction` (insurance + payment fields), `Settings`, `IntegrationSetting`, `LossReport`, purchasing entities.

Schema: prefer migrations; `TYPEORM_SYNCHRONIZE` only for bootstrap.

---

## 9. Security & Access Control

- bcrypt passwords; JWT sessions  
- RBAC; scoped sales queries  
- Helmet, Zod, masked secrets  
- DB/Redis not host-published by default  

---

## 10. Sales, Insurance & POS Logic

### Sale
`POST /sales/batch` → lock batches → decrement → insert sales + movements → optional franchise on first line.

### Insurance
- Provider + member ID when not `none`  
- Coverage % from settings (default 70)  
- Only `insuranceEligible` drugs share cost  

### POS
```
idle → initiate(patientShare) → pending
     → confirm(true) → approved → complete sale
     → confirm(false) → failed → retry
```

---

## 11. Integrations

| Integration | Behavior |
|-------------|----------|
| Titak | Settings/env key; update batch prices |
| Insurance keys | Stored masked; adapter hooks |
| POS | initiate / confirm / status; BehMellat adapter stub |

---

## 12. Error Handling & Observability

```json
{ "success": false, "code": "NOT_FOUND", "message": "…", "requestId": "uuid" }
```

| Source | HTTP | code |
|--------|------|------|
| ZodError | 400 | VALIDATION_ERROR |
| AppError | varies | err.code |
| QueryFailedError | 400 | DATABASE_ERROR |
| JWT | 401 | UNAUTHORIZED |
| Unknown | 500 | INTERNAL_ERROR |

See [ERROR_HANDLING_AND_LOGGING.md](./ERROR_HANDLING_AND_LOGGING.md).

---

## 13. Infrastructure & Deployment

Services: postgres, redis, backend, frontend, nginx (only published port).

```bash
cd infrastructure && cp .env.example .env
docker compose up --build -d
docker compose logs -f backend
```

Oracle Cloud ARM: `infrastructure/deploy/oracle-cloud.md`.

---

## 14. API Reference Summary

Prefix: `/api/v1`

| Area | Paths |
|------|-------|
| Setup / Auth | `/setup`, `/auth/*` |
| Staff / Branches | `/employees`, `/branches` |
| Inventory | `/inventory/*` |
| Sales | `/sales`, `/sales/summary`, `/sales/batch` |
| POS | `/integrations/pos/*` |
| Titak | `/integrations/titak/*` |
| Settings | `/settings/franchise`, `/settings/integrations` |
| Reporting / Loss | `/reporting`, `/loss-reports` |
| Health | `GET /health` |

---

## 15. Configuration & Environment

| Variable | Purpose |
|----------|---------|
| `POSTGRES_*` | Database |
| `JWT_SECRET` | Signing (required in prod) |
| `REDIS_URL` | Rate limits |
| `TYPEORM_SYNCHRONIZE` | Bootstrap only |
| `LOG_LEVEL` / `LOG_TO_FILES` | Logging |
| `NEXT_PUBLIC_API_URL` | Frontend API base |
| `HTTP_PORT` | Nginx host port |

---

## 16. Operational Runbook

1. Set secrets → compose up → `/health`  
2. `/en/setup` or `/fa/setup` → manager  
3. Branches → drugs/batches → sales  
4. Optional: Titak/insurance keys in Settings  

Incidents: correlate `requestId`; check DB/Redis; review `StockMovement`.

Backup: `postgres_data` volume + `pg_dump`.

---

## 17. Testing Strategy

Backend Jest (services, middleware, utils). Frontend unit tests (hooks, contexts, utils). Extend service tests for insurance/POS/stock rule changes.

---

## 18. Roadmap & Extension Points

- Formal migrations  
- Redis POS sessions  
- Real terminal SDK  
- Live insurer adapters  
- TLS + strict CORS  
- APM/Sentry  
- Playwright E2E  

---

## 19. Glossary

| Term | Meaning |
|------|---------|
| IRR | Iranian Rial |
| Batch | Stock lot at a branch |
| Basket | Grouped sale lines |
| Franchise fee | Optional fixed branch fee |
| Titak | External price service |
| Tamin / Salamat / Mosalah | Insurance funds |
| RBAC | Role-based access control |
| requestId | Log correlation id |
| AppError | Safe operational API error |
| POS | Card terminal payment |

---

*End of catalog.*
