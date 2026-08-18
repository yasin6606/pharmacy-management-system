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
| Backend        | Node.js, Express, TypeScript, TypeORM, Awilix, Zod, Winston, bcryptjs, jsonwebtoken |
| Database       | PostgreSQL 13                                   |
| Infrastructure | Docker, Docker Compose, Nginx                   |
| Build          | Webpack (backend), Next.js (frontend)           |

---

## Project Structure

```
pharmacy-management-system/
├── backend/                 # Express + TypeORM API
│   ├── src/
│   │   ├── core/            # config, errors, logger, middleware, utils
│   │   ├── modules/         # auth, employees, branches, inventory, sales,
│   │   │                    # loss-reports, purchasing, reporting, settings,
│   │   │                    # setup, integrations (titak, insurance, pos)
│   │   ├── container.ts     # Awilix DI
│   │   └── index.ts
│   ├── Dockerfile
│   └── package.json
├── frontend/                # Next.js App Router
│   ├── app/[locale]/        # i18n routes (auth + dashboard)
│   ├── components/          # forms, layouts, ui
│   ├── context/             # Auth, Error, SalesTabs
│   ├── hooks/
│   ├── i18n/ & messages/    # en.json + fa.json
│   ├── lib/
│   └── types/
├── infrastructure/
│   ├── docker-compose.yaml
│   └── nginx.conf
└── .gitignore
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 20 (recommended 22)
- Docker & Docker Compose
- Git

### 1. Clone the repository

```bash
git clone https://github.com/yasin6606/pharmacy-management-system.git
cd pharmacy-management-system
```

### 2. Run with Docker (recommended)

```bash
cd infrastructure
docker compose up --build -d
```

Services:
- **Frontend + API** → http://localhost (via Nginx)
- **PostgreSQL** → `localhost:5432`  
  - User: `postgres`  
  - Password: `123456`  
  - Database: `pharmacy_db`

The backend waits for a healthy Postgres instance before starting.

### 3. Local development (without Docker)

#### Backend

```bash
cd backend
cp .env.development.example .env.development   # create if needed
# Edit DATABASE_URL, JWT_SECRET, etc.
npm install
npm run dev
```

Default port: `3001`

#### Frontend

```bash
cd frontend
# Set NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
npm install
npm run dev
```

Default port: `3000`

### First-time Setup

1. Open the application.
2. You will be redirected to the **Setup** page.
3. Create the first manager account (email + password + full name).
4. Log in and start managing branches, employees, and inventory.

---

## Environment Variables

### Backend (`.env.development` / `.env.production`)

| Variable              | Description                          | Example                                      |
|-----------------------|--------------------------------------|----------------------------------------------|
| `NODE_ENV`            | Environment                          | `development` / `production`                 |
| `PORT`                | API port                             | `3001`                                       |
| `DATABASE_URL`        | PostgreSQL connection string         | `postgresql://postgres:123456@localhost:5432/pharmacy_db` |
| `JWT_SECRET`          | JWT signing secret                   | strong random string                         |
| `JWT_EXPIRES_IN`      | Token lifetime                       | `7d`                                         |
| `TITAK_API_KEY`       | Titak integration key                | —                                            |
| `OCR_SERVICE_URL`     | OCR service endpoint                 | —                                            |
| `TYPEORM_SYNCHRONIZE` | Auto-sync schema (dev only)          | `true` / `false`                             |

### Frontend

| Variable                | Description                     |
|-------------------------|---------------------------------|
| `NEXT_PUBLIC_API_URL`   | Backend API base path           | `/api/v1` (Docker) or full URL |

---

## API Overview

All routes are prefixed with `/api/v1`.

| Module          | Base Path                     | Notes                          |
|-----------------|-------------------------------|--------------------------------|
| Setup           | `/setup`                      | Initial manager creation       |
| Auth            | `/auth`                       | Login / logout / sessions      |
| Employees       | `/employees`                  | CRUD + role management         |
| Branches        | `/branches`                   | Multi-branch management        |
| Inventory       | `/inventory`                  | Drugs, batches, movements      |
| Sales           | `/sales`                      | Transactions & baskets         |
| Loss Reports    | `/loss-reports`               | Create & review workflow       |
| Reporting       | `/reporting`                  | CSV / PDF exports              |
| Purchasing      | `/purchasing`                 | Orders + OCR                   |
| Settings        | `/settings`                   | System config                  |
| Integrations    | `/integrations/*`             | Titak, Insurance, POS          |

Health check: `GET /health`

---

## Scripts

### Backend
```bash
npm run dev      # Development with hot reload
npm run build    # Webpack production build
npm start        # Run production build
```

### Frontend
```bash
npm run dev      # Next.js development server
npm run build    # Production build
npm start        # Serve production build
```

---

## Security Notes

- Passwords are hashed with bcrypt (cost 10).
- JWT-based authentication with configurable expiry.
- Helmet + CORS configured.
- Role-based middleware protects routes.
- Input validation with Zod on both client and server.
- Sensitive values must be provided via environment variables (never commit secrets).

---

## License

This project is private / proprietary unless otherwise stated by the author.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

**Built with ❤️ for modern pharmacy operations**
