# Pharmacy Management System

A modern, multi-branch pharmacy management platform built for real-world Iranian pharmacy operations.  
Supports inventory control with batch-level expiry tracking, point-of-sale, employee role-based access, loss reporting, purchasing with OCR, insurance & POS integrations, and comprehensive reporting.

**Author**: [yasin](https://github.com/yasin6606)  
**Repository**: [yasin6606/pharmacy-management-system](https://github.com/yasin6606/pharmacy-management-system)

---

## Features

### Core
- **Multi-branch support** – warehouses and retail branches with stock transfers
- **Role-based access control**
  - `junior` · `senior` · `manager` · `accountant`
- **Employee management** – sessions, branch history, secure authentication (JWT + bcrypt)
- **Initial setup wizard** – create the first manager account

### Inventory
- Drug catalog (name, brand, company)
- Batch tracking (expiry date, quantity, offer flag, purchase/selling price, versioned)
- Stock movements: transfer · adjustment · sale
- Automatic expiration alerts (cron job)
- Low-stock visibility

### Sales & POS
- Patient basket / multi-item sales
- Payment methods: cash · transfer · POS · credit
- Prescription reference support
- Offer & exchange sales
- Customer details (name, family, phone)

### Operations
- **Loss reports** – create → review (approve/reject) workflow
- **Purchasing** – suppliers, purchase orders, invoice image upload + OCR
- **Reporting** – sales & inventory reports with CSV and PDF export
- **Settings** – system-wide configuration

### Integrations
- Titak API
- Insurance adapters (extensible)
- POS adapters (e.g. BehMellat)
- OCR service for invoice processing

### UX
- Full **i18n** (English + Persian / Farsi) with `next-intl`
- Dark / light theme support
- Responsive dashboard with modern UI components
- Real-time error handling & toast notifications

---

## Tech Stack

| Layer          | Technology                                      |
|----------------|-------------------------------------------------|
| Frontend       | Next.js 16, React 19, TypeScript, Tailwind CSS 4, next-intl, next-themes, react-hook-form, Zod |
| Backend        | Node.js, Express, TypeScript, TypeORM, Awilix, Zod, Winston, bcryptjs, jsonwebtoken, ioredis |
| Database       | PostgreSQL 16                                   |
| Cache / limits | Redis 7 (login rate-limit store)                |
| Infrastructure | Docker Compose, Nginx reverse proxy             |
| Build          | Webpack (backend), Next.js (frontend)           |

---

## Project Structure

```
pharmacy-management-system/
├── backend/
├── frontend/
├── infrastructure/
│   ├── docker-compose.yaml
│   ├── nginx.conf
│   ├── .env.example
│   └── README.md
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 20 (recommended 22)
- Docker & Docker Compose
- Git

### 1. Clone

```bash
git clone https://github.com/yasin6606/pharmacy-management-system.git
cd pharmacy-management-system
```

### 2. Run with Docker (recommended)

```bash
cd infrastructure
cp .env.example .env
# set strong POSTGRES_PASSWORD and JWT_SECRET

# First boot only: allow TypeORM to create tables (or run migrations instead)
# TYPEORM_SYNCHRONIZE=true

docker compose up --build -d
```

| Service   | Access |
|-----------|--------|
| App + API | http://localhost (Nginx) |
| Health    | http://localhost/health |
| Postgres  | internal only (`postgres:5432`) |
| Redis     | internal only (`redis:6379`) |

See [infrastructure/README.md](./infrastructure/README.md) for architecture decisions, scaling, and optional DB port publishing.

### 3. Local development (without Docker)

#### Backend

```bash
cd backend
# create .env.development with DATABASE_URL, JWT_SECRET, …
npm install
npm run dev
```

Default port: `3001`

#### Frontend

```bash
cd frontend
# NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
npm install
npm run dev
```

Default port: `3000`

### First-time Setup

1. Open the app → **Setup** page  
2. Create the first manager  
3. Log in and configure branches / inventory  

---

## Environment Variables

### Docker (`infrastructure/.env`)

Copy from `infrastructure/.env.example`. Required: `POSTGRES_PASSWORD`, `JWT_SECRET`.

### Backend (local)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Signing secret (required in production) |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `REDIS_URL` | Optional; enables shared rate limits |
| `TYPEORM_SYNCHRONIZE` | `true` only for local/first bootstrap |

### Frontend

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | `/api/v1` behind Nginx, or full URL in local dev |

---

## API Overview

All routes are prefixed with `/api/v1`.

| Module | Base Path |
|--------|-----------|
| Setup | `/setup` |
| Auth | `/auth` |
| Employees | `/employees` |
| Branches | `/branches` |
| Inventory | `/inventory` |
| Sales | `/sales` |
| Loss Reports | `/loss-reports` |
| Reporting | `/reporting` |
| Purchasing | `/purchasing` |
| Settings | `/settings` |
| Integrations | `/integrations/*` |

Health: `GET /health`

---

## Scripts

### Backend
```bash
npm run dev
npm run build
npm start
npm test
npm run migration:run
```

### Frontend
```bash
npm run dev
npm run build
npm start
npm test
```

---

## Security Notes

- Passwords hashed with bcrypt  
- JWT auth + RBAC middleware  
- Login rate limiting (Redis when available)  
- Helmet; Zod validation  
- Secrets only via environment variables  
- DB/Redis not published on the host by default  

---

## License

This project is private / proprietary unless otherwise stated by the author.

---

**Built with ❤️ for modern pharmacy operations**
