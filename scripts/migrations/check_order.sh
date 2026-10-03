#!/usr/bin/env bash
set -euo pipefail

DATABASES=(
anpardaz
ansarraf
platform
accounting
banner
hoosh
market
financial
)

for db in "${DATABASES[@]}"
do
 echo
 echo "====== $db ======"

 find "databases/$db" \
 -maxdepth 1 \
 -type f \
 -name "*.sql" \
 -printf "%f\n" \
 | sort -V

done
