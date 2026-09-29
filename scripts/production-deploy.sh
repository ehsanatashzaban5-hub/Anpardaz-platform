#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

required=(
  infrastructure/production/platform.env
  infrastructure/production/admin.env
  infrastructure/production/anpardaz.env
  infrastructure/production/ansarraf.env
  infrastructure/production/banner.env
  infrastructure/production/accounting.env
  infrastructure/production/web.env
)

for file in "${required[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Missing production env: $file" >&2
    exit 1
  fi
done

compose=(
  "databases/docker-compose.yml"
  "infrastructure/production/anpardaz.compose.yml"
  "infrastructure/production/ansarraf.compose.yml"
  "infrastructure/production/platform.compose.yml"
  "infrastructure/production/accounting.compose.yml"
  "infrastructure/production/admin.compose.yml"
  "infrastructure/production/web.compose.yml"
  "apps/mobile/docker-compose.yml"
  "infrastructure/production/public-gateway.compose.yml"
)

echo "Validating production Compose files..."
for file in "${compose[@]}"; do
  docker compose -f "$file" config -q
done

echo "Building Web..."
docker compose -f infrastructure/production/web.compose.yml build web

echo "Starting Web..."
docker compose -f infrastructure/production/web.compose.yml up -d web

echo "Starting backend service groups..."
for file in   infrastructure/production/anpardaz.compose.yml   infrastructure/production/ansarraf.compose.yml   infrastructure/production/platform.compose.yml   infrastructure/production/accounting.compose.yml   infrastructure/production/admin.compose.yml
do
  docker compose -f "$file" up -d
done

echo "Starting mobile frontend container..."
docker compose -f apps/mobile/docker-compose.yml up -d --build

echo "Starting public gateway..."
docker compose -f infrastructure/production/public-gateway.compose.yml up -d

echo "Waiting for public health endpoints..."
checks=(
  "/health"
  "/platform/health"
  "/ansarraf/health"
  "/banner/health"
  "/anpardaz/health"
  "/admin-api/health"
)
for path in "${checks[@]}"; do
  ok=0
  for attempt in $(seq 1 30); do
    if curl -fsS "http://127.0.0.1$path" >/dev/null; then
      ok=1
      break
    fi
    sleep 2
  done
  if [[ "$ok" -ne 1 ]]; then
    echo "Health check failed: $path" >&2
    exit 1
  fi
done

echo "Public gateway and routed services are healthy."
