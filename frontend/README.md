# Pharmacy Management System — Frontend

Next.js App Router UI for multi-branch pharmacy operations (EN/FA, light/dark, glass design).

## Stack

- **Next.js** (App Router) + **React** + **TypeScript**
- **Tailwind CSS** + design tokens in `app/[locale]/globals.css`
- **next-intl** — locales `en` / `fa` (`messages/en.json`, `messages/fa.json`)
- **next-themes** — light/dark
- **Axios** — `lib/api.ts` with `ApiError`, request-id, 401 redirect

## Local development

```bash
cd frontend
npm install
# Backend API default in dev: http://localhost:3001/api/v1
npm run dev
```

Open [http://localhost:3000/en](http://localhost:3000/en) or `/fa`.

For Docker, the image is built with `NEXT_PUBLIC_API_URL=/api/v1` and Nginx proxies `/api` to the backend.

## Structure

```
app/[locale]/
  (auth)/login, setup
  (dashboard)/dashboard, inventory, sales, customers, operations, …
components/ui, components/forms
context/   AuthContext, ErrorContext, SalesTabsContext
hooks/     useApi, useRole, …
lib/       api.ts, currency.ts (formatIRR), offlineQueue.ts, logger.ts
messages/  en.json, fa.json
```

## Key UX behaviors

| Area | Behavior |
|------|----------|
| Auth | Bearer token in `sessionStorage`; logout invalidates server session |
| Currency | `formatIRR` everywhere for money |
| Errors | Toasts via `ErrorContext`; 401 → login redirect |
| Theme / language | Available on login, setup, and dashboard shell |

## Tests

```bash
npm test
```

See `frontend/__tests__/` and root [backend/tests/README.md](../backend/tests/README.md).

## Build

```bash
npm run build
npm start
```

Production image: `frontend/Dockerfile` (multi-stage).
