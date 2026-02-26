#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TARGET_HOST="${TARGET_HOST:-192.168.0.109}"
TARGET_PORT="${TARGET_PORT:-2222}"
TARGET_USER="${TARGET_USER:-user}"
SSH_KEY_PATH="${SSH_KEY_PATH:-$HOME/.ssh/id_ed25519}"
INSTALL_DOCKER="${INSTALL_DOCKER:-false}"

./scripts/preflight.sh

echo "[deploy] Ejecutando Ansible con prompt de sudo..."
ansible-playbook \
  -i ansible/inventory.ini \
  ansible/deploy.yml \
  -u "$TARGET_USER" \
  --private-key "$SSH_KEY_PATH" \
  -e "ansible_port=$TARGET_PORT install_docker=$INSTALL_DOCKER" \
  -K

echo "[deploy] Listo. Verifica en: http://${TARGET_HOST}:3000"
