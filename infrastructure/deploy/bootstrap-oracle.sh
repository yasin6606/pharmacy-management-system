#!/usr/bin/env bash
# Bootstrap Ubuntu aarch64 (Oracle Ampere A1) for the pharmacy Docker Compose stack.
# Safe to re-run (idempotent where practical).
set -euo pipefail

echo "==> Detecting architecture"
ARCH="$(uname -m)"
echo "    uname -m = ${ARCH}"
if [[ "${ARCH}" != "aarch64" && "${ARCH}" != "arm64" ]]; then
  echo "WARNING: This script targets Oracle Ampere (ARM). You are on ${ARCH}."
  echo "         Continue only if you know what you are doing."
fi

echo "==> System packages"
sudo apt-get update -y
sudo apt-get install -y \
  ca-certificates \
  curl \
  gnupg \
  git \
  ufw \
  jq \
  unzip

echo "==> Docker Engine + Compose plugin"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
else
  echo "    Docker already installed: $(docker --version)"
fi

sudo systemctl enable --now docker

# Allow current user to run docker without sudo
if ! groups "${USER}" | grep -q docker; then
  sudo usermod -aG docker "${USER}"
  echo "    Added ${USER} to group docker (re-login required for non-sudo docker)"
fi

echo "==> Host firewall (UFW)"
# SSH must stay open or you lock yourself out
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status

echo "==> Kernel / Docker convenience"
# Avoid low default inotify limits under many containers (optional)
if [[ -f /etc/sysctl.conf ]] && ! grep -q fs.inotify.max_user_watches /etc/sysctl.conf; then
  echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf >/dev/null
  sudo sysctl -p >/dev/null 2>&1 || true
fi

echo "==> Done"
echo
echo "Next steps:"
echo "  1. Re-login (or: newgrp docker)"
echo "  2. git clone https://github.com/yasin6606/pharmacy-management-system.git"
echo "  3. cd pharmacy-management-system/infrastructure"
echo "  4. cp .env.example .env && nano .env"
echo "  5. docker compose up --build -d"
echo
echo "Guide: infrastructure/deploy/oracle-cloud.md"
