#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/jenkins"

docker compose up -d
echo "Jenkins iniciado en http://localhost:8080"
echo "Password inicial:"
for _ in $(seq 1 30); do
  if docker exec jenkins-1p-express test -f /var/jenkins_home/secrets/initialAdminPassword; then
    docker exec jenkins-1p-express cat /var/jenkins_home/secrets/initialAdminPassword
    exit 0
  fi
  sleep 2
done

echo "Aun no esta listo. Revisa logs con: docker logs jenkins-1p-express"
