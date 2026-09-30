#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

cp -n databases/.env.example databases/.env 2>/dev/null || true

make_service_env() {
  local service="$1"
  local port="$2"
  local db="$3"
  local dbport="$4"
  local user="$5"
  local password="$6"
  local file="services/${service}/.env"

  if [[ ! -f "$file" ]]; then
    cp "services/${service}/.env.example" "$file"
    sed -i "s#^PORT=.*#PORT=${port}#; s#^DATABASE_URL=.*#DATABASE_URL=postgresql://${user}:${password}@localhost:${dbport}/${db}#" "$file"
  fi
}

make_service_env anpardaz 4001 anpardaz 5433 anpardaz local-anpardaz-password
make_service_env ansarraf 4002 ansarraf 5434 ansarraf local-ansarraf-password
make_service_env platform 4003 platform 5435 platform local-platform-password
make_service_env accounting 4004 accounting 5436 accounting local-accounting-password
make_service_env banner 4005 banner 5437 banner local-banner-password
make_service_env market 4007 market 5439 market local-market-password
make_service_env hoosh 4008 hoosh 5438 hoosh local-hoosh-password
make_service_env financial 4009 financial 5440 financial local-financial-password

if [[ ! -f services/admin/.env ]]; then
  cp services/admin/.env.example services/admin/.env
fi
sed -i \
  's#^PORT=.*#PORT=4006#; s#^PLATFORM_SERVICE_URL=.*#PLATFORM_SERVICE_URL=http://127.0.0.1:4003#; s#^ANSARRAF_SERVICE_URL=.*#ANSARRAF_SERVICE_URL=http://127.0.0.1:4002#; s#^ANPARDAZ_SERVICE_URL=.*#ANPARDAZ_SERVICE_URL=http://127.0.0.1:4001#; s#^BANNER_SERVICE_URL=.*#BANNER_SERVICE_URL=http://127.0.0.1:4005#; s#^ACCOUNTING_SERVICE_URL=.*#ACCOUNTING_SERVICE_URL=http://127.0.0.1:4004#; s#^HOOSH_SERVICE_URL=.*#HOOSH_SERVICE_URL=http://127.0.0.1:4008#; s#^MARKET_SERVICE_URL=.*#MARKET_SERVICE_URL=http://127.0.0.1:4007#; s#^FINANCIAL_SERVICE_URL=.*#FINANCIAL_SERVICE_URL=http://127.0.0.1:4009#' \
  services/admin/.env

if ! grep -q '^IDENTITY_PRIVATE_KEY_B64=' services/platform/.env 2>/dev/null || grep -q 'generated-by-bootstrap-local' services/platform/.env; then
  tmpdir="$(mktemp -d)"
  trap 'rm -rf "$tmpdir"' EXIT
  openssl genpkey -algorithm Ed25519 -outform DER -out "$tmpdir/private.der" >/dev/null 2>&1
  openssl pkey -in "$tmpdir/private.der" -inform DER -pubout -outform DER -out "$tmpdir/public.der" >/dev/null 2>&1
  private_b64="$(base64 -w0 "$tmpdir/private.der")"
  public_b64="$(base64 -w0 "$tmpdir/public.der")"
  sed -i '/^IDENTITY_PRIVATE_KEY_B64=/d;/^IDENTITY_ISSUER=/d' services/platform/.env
  printf '\nIDENTITY_ISSUER=anpardaz-platform\nIDENTITY_PRIVATE_KEY_B64=%s\n' "$private_b64" >> services/platform/.env
  for service in anpardaz ansarraf banner hoosh market financial; do
    sed -i '/^IDENTITY_SERVICE_URL=/d;/^IDENTITY_ISSUER=/d;/^IDENTITY_PUBLIC_KEY_B64=/d' "services/${service}/.env"
    printf '\nIDENTITY_SERVICE_URL=http://localhost:4003\nIDENTITY_ISSUER=anpardaz-platform\nIDENTITY_PUBLIC_KEY_B64=%s\n' "$public_b64" >> "services/${service}/.env"
  done
fi

if [[ ! -f services/platform/.env ]]; then
  echo "Platform env was not created" >&2
  exit 1
fi

if ! grep -q '^GUEST_INTERACTION_SECRET=' services/platform/.env; then
  printf '\nGUEST_INTERACTION_SECRET=%s\n' "$(openssl rand -hex 32)" >> services/platform/.env
fi

if [[ ! -f services/accounting/.env ]]; then
  cp services/accounting/.env.example services/accounting/.env
fi

generate_token() {
  local file="$1"
  local var="$2"
  if grep -q "^\${var}=CHANGE_ME$" "$file" 2>/dev/null || grep -q "^\${var}=replace-in-local-bootstrap$" "$file" 2>/dev/null; then
    sed -i "s#^\${var}=.*#\${var}=$(openssl rand -hex 32)#" "$file"
  fi
}

for service in anpardaz ansarraf banner hoosh market financial accounting admin; do
  file="services/${service}/.env"
  case "$service" in
    anpardaz) var="ANPARDAZ_INTERNAL_TOKEN" ;;
    ansarraf) var="ANSARRAF_INTERNAL_TOKEN" ;;
    banner) var="BANNER_INTERNAL_TOKEN" ;;
    hoosh) var="HOOSH_INTERNAL_TOKEN" ;;
    market) var="MARKET_INTERNAL_TOKEN" ;;
    financial) var="FINANCIAL_INTERNAL_TOKEN" ;;
    accounting) var="ACCOUNTING_INTERNAL_TOKEN" ;;
    admin) var="ADMIN_INTERNAL_TOKEN" ;;
  esac
  generate_token "$file" "$var"
done

for service in anpardaz ansarraf banner hoosh market financial; do
  file="services/${service}/.env"
  sed -i 's#^IDENTITY_SERVICE_URL=.*#IDENTITY_SERVICE_URL=http://localhost:4003#' "$file"
done

for pair in \
  "ANPARDAZ_SERVICE_URL=http://127.0.0.1:4001" \
  "ANSARRAF_SERVICE_URL=http://127.0.0.1:4002" \
  "BANNER_SERVICE_URL=http://127.0.0.1:4005" \
  "ACCOUNTING_SERVICE_URL=http://127.0.0.1:4004" \
  "HOOSH_SERVICE_URL=http://127.0.0.1:4008" \
  "MARKET_SERVICE_URL=http://127.0.0.1:4007" \
  "FINANCIAL_SERVICE_URL=http://127.0.0.1:4009"; do
  var="${pair%%=*}"
  value="${pair#*=}"
  sed -i "s#^${var}=.*#${var}=${value}#" services/admin/.env
done

docker compose --env-file databases/.env -f databases/docker-compose.yml up -d
bash databases/migrate.sh

for service in anpardaz ansarraf platform accounting banner hoosh market financial admin; do
  pnpm --dir "services/${service}" install
  pnpm --dir "services/${service}" build
done

pnpm --dir apps/mobile install
pnpm --dir apps/mobile run build
pnpm --dir apps/web install
pnpm --dir apps/web run build
pnpm --dir apps/admin install
pnpm --dir apps/admin run build

echo "Local An Pardaz platform bootstrap completed successfully across all domain services and databases."
