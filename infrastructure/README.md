# Infrastructure

## Architecture

```
Browser → :80 Nginx
              ├─ /api/*  → backend:3001  (Express)
              ├─ /health → backend:3001
              └─ /*      → frontend:3000 (Next.js)

Internal network only:
  postgres:5432   redis:6379   backend   frontend
```

### Why this layout?

| Choice | Reason |
|--------|--------|
| **Nginx as sole public entry** | TLS termination later, path routing, one attack surface |
| **No published Postgres/Redis ports** | DB is not reachable from the internet by default |
| **Redis in the stack** | Shared login rate-limits if you scale `backend` replicas |
| **Postgres 16** | Supported release (13 is EOL) |
| **Secrets via `.env`** | No passwords/JWT in git |
| **`TYPEORM_SYNCHRONIZE=false`** | Schema changes go through migrations in real deploys |
| **Healthchecks** | Compose waits until services are actually ready |

## Quick start

```bash
cd infrastructure
cp .env.example .env
# edit POSTGRES_PASSWORD and JWT_SECRET

docker compose up --build -d
```

Open http://localhost (or `HTTP_PORT` from `.env`).

First visit → **Setup** page → create manager → login.

## Useful commands

```bash
docker compose ps
docker compose logs -f backend
docker compose down          # keep volumes
docker compose down -v       # wipe DB + Redis data
```

## Local DB access (optional)

Create `docker-compose.override.yaml` (gitignored if you want):

```yaml
services:
  postgres:
    ports:
      - "5432:5432"
```

## Scaling the API

```bash
docker compose up -d --scale backend=2
```

Redis keeps rate-limit counters consistent across replicas.

## TLS

Terminate TLS on Nginx (or a cloud load balancer in front of it).
Do not publish backend/frontend ports when TLS is enabled at the edge.
