# Security model & hardening (2026-08-27)

Professional security review of the Pharmacy Management System: threat model, findings, and fixes.

## Scope

| In scope | Out of scope (current) |
|----------|-------------------------|
| AuthN / AuthZ / sessions | Physical POS terminal firmware |
| API input validation | Full PCI-DSS certification |
| Secrets handling (env + integration settings) | Formal penetration test report |
| Docker / Nginx edge headers | Multi-tenant SaaS isolation |
| Account lifecycle (disable, role change) | Client device malware |

## Architecture trust boundaries

```
Browser (untrusted) → Nginx → Frontend / API
API (semi-trusted after JWT+session) → PostgreSQL / Redis
API → external Titak / insurer / POS (untrusted networks)
```

## Findings & remediation

### Cycle 1 — Identity & sessions

| ID | Severity | Finding | Fix |
|----|----------|---------|-----|
| S1 | **High** | JWT `role`/`branchId` trusted until expiry after role demotion | `authMiddleware` loads **Employee from DB** and uses DB `role` / `currentBranchId` |
| S2 | **High** | No way to disable a fired employee while keeping history | `employees.is_active`; login & middleware reject inactive accounts |
| S3 | **High** | Password/role change left existing sessions valid | Invalidate all open sessions on password change, role change, deactivate, delete |
| S4 | Medium | Weak password policy (min 6) | Policy: ≥8 chars, letter + digit (`passwordPolicy.ts`) |
| S5 | Low | bcrypt cost 10 | Raised to **12** |

### Cycle 2 — API surface & bootstrap

| ID | Severity | Finding | Fix |
|----|----------|---------|-----|
| S6 | Medium | `/setup` unbounded on exposed hosts | Rate limit 5/hour + transactional create |
| S7 | Medium | Email case variance | Normalize email to lowercase on login/create/setup |
| S8 | Low | CORS rejection threw `Error` (risk of 500) | Deny with `callback(null, false)` |
| S9 | Medium | Rate-limit IP wrong behind Nginx | `app.set('trust proxy', 1)` |

### Cycle 3 — Edge & residual risks

| ID | Severity | Finding | Fix / status |
|----|----------|---------|--------------|
| S10 | Medium | Minimal security headers | Nginx: CSP, Permissions-Policy, `server_tokens off` |
| S11 | Medium | Integration API keys plaintext in DB | Masked in UI; **encrypt-at-rest** remains roadmap |
| S12 | Medium | Bearer token in `sessionStorage` (XSS impact) | Mitigated by CSP; httpOnly cookies = future work |
| S13 | Low | POS sessions in-memory | Single-node only; Redis store on roadmap |

## Controls already present (confirmed)

- bcrypt password hashing
- Login rate limiting (Redis-backed when `REDIS_URL` set)
- Session logout invalidation (`logout_time`)
- RBAC on employees, sales, ops, settings
- Zod validation on critical DTOs
- Helmet on Express
- Secrets not returned in full from integrations GET
- Postgres/Redis not published by default in Compose

## Operator checklist

1. Strong unique `JWT_SECRET` and `POSTGRES_PASSWORD`
2. Set `CORS_ORIGIN` to exact browser origin(s)
3. `TYPEORM_SYNCHRONIZE=false` after bootstrap; run migrations including `EmployeeIsActive`
4. Terminate TLS at the edge; keep 5432/6379 private
5. Disable (`isActive=false`) or delete staff who leave — sessions are closed
6. Prefer ≥8 character staff passwords with letters and numbers

## Residual risk acceptance

| Risk | Acceptance |
|------|------------|
| XSS → token theft | Accept until httpOnly auth migration; CSP reduces likelihood |
| Integration secrets at rest | Accept for single-tenant pharmacy DBs; encrypt later |
| Setup endpoint public until first user | Accept with rate limit; close network after bootstrap |

## Related docs

- [ERROR_HANDLING_AND_LOGGING.md](./ERROR_HANDLING_AND_LOGGING.md)
- [PROJECT_CATALOG.md](./PROJECT_CATALOG.md) § Security
- [infrastructure/README.md](../infrastructure/README.md)
