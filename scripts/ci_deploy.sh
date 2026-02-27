#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

INVENTORY_FILE="${INVENTORY_FILE:-ansible/inventory.ini}"
get_inventory_var() {
  local key="$1"
  awk -v key="$key" '
    NF && $1 !~ /^#/ && $1 !~ /^\[/ {
      for (i = 1; i <= NF; i++) {
        if ($i ~ ("^" key "=")) {
          split($i, parts, "=")
          print parts[2]
          exit
        }
      }
    }
  ' "$INVENTORY_FILE"
}

TARGET_HOST="${TARGET_HOST:-$(get_inventory_var "ansible_host")}"
TARGET_PORT="${TARGET_PORT:-$(get_inventory_var "ansible_port")}"
TARGET_USER="${TARGET_USER:-$(get_inventory_var "ansible_user")}"

TARGET_HOST="${TARGET_HOST:-192.168.0.109}"
TARGET_PORT="${TARGET_PORT:-2222}"
TARGET_USER="${TARGET_USER:-user}"
SSH_KEY_PATH="${SSH_KEY_PATH:-$HOME/.ssh/id_ed25519}"
SUDO_PASSWORD="${SUDO_PASSWORD:-}"
INSTALL_DOCKER="${INSTALL_DOCKER:-false}"

export TARGET_HOST TARGET_PORT TARGET_USER SSH_KEY_PATH INSTALL_DOCKER

if [[ -z "$SUDO_PASSWORD" ]]; then
  echo "[ci] ERROR: Define SUDO_PASSWORD como variable de entorno en Jenkins."
  exit 1
fi

./scripts/preflight.sh

ansible-playbook \
  -i ansible/inventory.ini \
  ansible/deploy.yml \
  -u "$TARGET_USER" \
  --private-key "$SSH_KEY_PATH" \
  -e "ansible_port=$TARGET_PORT ansible_become_password=$SUDO_PASSWORD install_docker=$INSTALL_DOCKER"

curl -fsS "http://${TARGET_HOST}:3000/api/health" >/dev/null
echo "[ci] Deploy y smoke test OK."
