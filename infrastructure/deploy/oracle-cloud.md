# Deploy on Oracle Cloud Always Free (Docker Compose)

This guide deploys the **full stack** (Nginx, frontend, backend, Postgres, Redis) on a single **Always Free Ampere A1** VM.

## Specs to request (2026)

| Setting | Value |
|---------|--------|
| Shape | `VM.Standard.A1.Flex` (ARM) |
| OCPUs | **2** |
| Memory | **12 GB** |
| Boot volume | 50–100 GB (from Always Free block storage pool) |
| Image | **Ubuntu 22.04 or 24.04 (AArch64)** |
| Public IP | Yes |

> Official Always Free Ampere limit is **2 OCPU + 12 GB RAM** total. Older guides quoting 4/24 are outdated.

Signup: https://www.oracle.com/cloud/free/

---

## 1. Create the instance

1. Oracle Cloud Console → **Compute → Instances → Create instance**
2. Name: `pharmacy`
3. Image: Canonical Ubuntu **aarch64** (not x86)
4. Shape: **Ampere** → A1.Flex → 2 OCPU / 12 GB
5. Networking: assign a **public IPv4**
6. Add your **SSH public key**
7. Create

If you see **Out of host capacity**, switch region or retry later (common on free tier).

---

## 2. Open firewall ports (VCN Security List)

Console → **Networking → Virtual Cloud Networks → your VCN → Security Lists → Default**

**Ingress rules** (stateful):

| Source | Protocol | Port | Purpose |
|--------|----------|------|---------|
| `0.0.0.0/0` | TCP | 22 | SSH |
| `0.0.0.0/0` | TCP | 80 | HTTP (Nginx) |
| `0.0.0.0/0` | TCP | 443 | HTTPS (optional later) |

Do **not** open 3000, 3001, 5432, or 6379 to the internet.

Also allow the same ports on the instance **iptables/ufw** if enabled (script below handles ufw).

---

## 3. SSH and bootstrap

```bash
ssh -i ~/.ssh/your-key ubuntu@YOUR_PUBLIC_IP
```

Run the bootstrap script (or copy-paste the same commands):

```bash
curl -fsSL https://raw.githubusercontent.com/yasin6606/pharmacy-management-system/main/infrastructure/deploy/bootstrap-oracle.sh | bash
```

Or clone first, then:

```bash
git clone https://github.com/yasin6606/pharmacy-management-system.git
cd pharmacy-management-system
bash infrastructure/deploy/bootstrap-oracle.sh
```

Log out and back in (or `newgrp docker`) so the `docker` group applies.

---

## 4. Configure secrets

```bash
cd ~/pharmacy-management-system/infrastructure   # or your clone path
cp .env.example .env
nano .env
```

**Required:**

```env
POSTGRES_PASSWORD=use-a-long-random-password
JWT_SECRET=use-another-long-random-string
TYPEORM_SYNCHRONIZE=true
HTTP_PORT=80
```

After the first successful boot (tables created), set `TYPEORM_SYNCHRONIZE=false` and prefer migrations.

---

## 5. Launch the stack

```bash
cd ~/pharmacy-management-system/infrastructure
docker compose up --build -d
docker compose ps
docker compose logs -f backend
```

Open: `http://YOUR_PUBLIC_IP`

1. **Setup** page → create first manager  
2. Login → use the app  

Health: `http://YOUR_PUBLIC_IP/health`

---

## 6. ARM notes

Ampere is **linux/arm64**. Official images we use are multi-arch:

- `node:22.14-alpine`
- `postgres:16-alpine`
- `redis:7-alpine`
- `nginx:1.27-alpine`

If a build fails with “exec format error”, force platform in Compose:

```yaml
platform: linux/arm64
```

on that service (usually not needed for official images).

---

## 7. Optional HTTPS (Let's Encrypt)

When you have a domain pointing to the public IP:

1. Install Certbot on the host **or** add a Caddy/Nginx TLS config  
2. Open port **443** in the Security List  
3. Prefer terminating TLS on the host or a small sidecar; keep app containers internal  

---

## 8. Ops cheatsheet

```bash
# Status
docker compose -f ~/pharmacy-management-system/infrastructure/docker-compose.yaml ps

# Logs
docker compose -f .../docker-compose.yaml logs -f --tail=100 backend

# Update code
cd ~/pharmacy-management-system && git pull
cd infrastructure && docker compose up --build -d

# Stop (keep data)
docker compose down

# Wipe DB (destructive)
docker compose down -v
```

**Backups:** periodically dump Postgres:

```bash
docker compose exec -T postgres pg_dump -U postgres pharmacy_db | gzip > backup-$(date +%F).sql.gz
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Out of host capacity | Other region / retry / smaller shape temporarily |
| `docker: permission denied` | `newgrp docker` or re-login |
| Backend unhealthy | `docker compose logs backend` — check `DATABASE_URL` / JWT |
| Frontend 502 | Wait for healthchecks; `docker compose ps` |
| Can't reach site | Security List ports 80/22; public IP assigned |
| OOM / kills | Ensure shape is 12 GB; reduce Redis `maxmemory` if needed |

Idle Always Free instances can be reclaimed by Oracle if utilization stays very low for days — keep the stack running.
