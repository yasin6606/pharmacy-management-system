#!/usr/bin/env bash
# Pull latest code and rebuild the Compose stack (run from anywhere).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
INFRA="${ROOT}/infrastructure"

echo "==> Repo: ${ROOT}"
cd "${ROOT}"
git pull --ff-only

cd "${INFRA}"
if [[ ! -f .env ]]; then
  echo "ERROR: ${INFRA}/.env missing. Copy .env.example and set secrets first."
  exit 1
fi

echo "==> Rebuild & restart"
docker compose up --build -d
docker compose ps

echo "==> Health"
curl -fsS "http://127.0.0.1/health" || curl -fsS "http://127.0.0.1:80/health" || true
echo
echo "Update complete."
