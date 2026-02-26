#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/jenkins"

docker compose up -d
echo "Jenkins iniciado en http://localhost:8080"
echo "Password inicial:"
docker exec jenkins-1p-express cat /var/jenkins_home/secrets/initialAdminPassword
