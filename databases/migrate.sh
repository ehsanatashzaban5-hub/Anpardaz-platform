#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.yml"

[[ -f "${ENV_FILE}" ]] || { echo "Missing ${ENV_FILE}. Copy .env.example to .env first."; exit 1; }
set -a
source "${ENV_FILE}"
set +a

run_migrations() {
  local service="$1" database="$2" user="$3" password="$4" dir="$5"
  local migration_file migration version applied

  echo "Migrating ${service}..."
  shopt -s nullglob
  local migrations=("${ROOT_DIR}/${dir}"/*.sql)
  shopt -u nullglob
  (( ${#migrations[@]} )) || { echo "No SQL migrations found for ${service}."; return 0; }

  IFS=$'\n' migrations=( $(printf '%s\n' "${migrations[@]}" | sort) )

  for migration_file in "${migrations[@]}"; do
    migration="$(basename "${migration_file}" .sql)"
    applied="$(docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" exec -T "${service}" \
      env PGPASSWORD="${password}" psql -X -Atq -U "${user}" -d "${database}" \
      -c "SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '${migration}');" 2>/dev/null || true)"

    if [[ "${applied}" == "t" ]]; then
      echo "  -> ${migration} (already applied)"
      continue
    fi

    echo "  -> ${migration}"
    docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" exec -T "${service}" \
      env PGPASSWORD="${password}" psql -X -v ON_ERROR_STOP=1 -U "${user}" -d "${database}" < "${migration_file}"
  done
}

run_migrations anpardaz-db "${ANPARDAZ_DB_NAME}" "${ANPARDAZ_DB_USER}" "${ANPARDAZ_DB_PASSWORD}" anpardaz
run_migrations ansarraf-db "${ANSARRAF_DB_NAME}" "${ANSARRAF_DB_USER}" "${ANSARRAF_DB_PASSWORD}" ansarraf
run_migrations platform-db "${PLATFORM_DB_NAME}" "${PLATFORM_DB_USER}" "${PLATFORM_DB_PASSWORD}" platform
run_migrations accounting-db "${ACCOUNTING_DB_NAME}" "${ACCOUNTING_DB_USER}" "${ACCOUNTING_DB_PASSWORD}" accounting
run_migrations banner-db "${BANNER_DB_NAME}" "${BANNER_DB_USER}" "${BANNER_DB_PASSWORD}" banner

echo "All database migrations completed."
