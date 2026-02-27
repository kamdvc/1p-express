#!/usr/bin/env bash
set -euo pipefail

TARGET_HOST="${TARGET_HOST:-192.168.0.109}"
TARGET_PORT="${TARGET_PORT:-2222}"
TARGET_USER="${TARGET_USER:-user}"
SSH_KEY_PATH="${SSH_KEY_PATH:-$HOME/.ssh/id_ed25519}"
INSTALL_DOCKER="${INSTALL_DOCKER:-false}"

echo "[preflight] Verificando llave SSH..."
if [[ ! -f "$SSH_KEY_PATH" ]]; then
  echo "[preflight] ERROR: No existe llave SSH en: $SSH_KEY_PATH"
  exit 1
fi

echo "[preflight] Verificando SSH a ${TARGET_USER}@${TARGET_HOST}:${TARGET_PORT}..."
ssh -p "$TARGET_PORT" -i "$SSH_KEY_PATH" -o BatchMode=yes -o ConnectTimeout=8 "${TARGET_USER}@${TARGET_HOST}" "echo ok" >/dev/null

echo "[preflight] Verificando Docker daemon remoto..."
if [[ "$INSTALL_DOCKER" == "true" ]]; then
  echo "[preflight] INSTALL_DOCKER=true, se omite validación de daemon Docker."
  echo "[preflight] El playbook intentará instalar/iniciar Docker en remoto."
  exit 0
fi

if ! ssh -p "$TARGET_PORT" -i "$SSH_KEY_PATH" "${TARGET_USER}@${TARGET_HOST}" 'docker info >/dev/null 2>&1'; then
  echo "[preflight] ERROR: Docker daemon no disponible en servidor remoto."
  echo "[preflight] Inicia Docker Desktop en Laptop 2 y habilita integracion WSL para Ubuntu."
  exit 1
fi

echo "[preflight] Todo listo."
