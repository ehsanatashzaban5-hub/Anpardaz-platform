#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "Rolling back the frontend/gateway deployment to the previous container images."
docker compose -f infrastructure/production/public-gateway.compose.yml down
docker compose -f infrastructure/production/web.compose.yml down

if [[ -n "${WEB_ROLLBACK_IMAGE:-}" ]]; then
  docker tag "$WEB_ROLLBACK_IMAGE" anpardaz-web:rollback
  docker run -d --name anpardaz-web-rollback --restart unless-stopped     --publish 127.0.0.1:4173:8080     --read-only --tmpfs /tmp     --security-opt no-new-privileges:true --cap-drop ALL     anpardaz-web:rollback
  echo "Rollback Web image started on 127.0.0.1:4173."
else
  echo "WEB_ROLLBACK_IMAGE is not set; Web is stopped and must be restored from the previous image tag." >&2
  exit 1
fi
