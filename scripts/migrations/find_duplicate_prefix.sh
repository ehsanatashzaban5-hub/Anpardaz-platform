#!/usr/bin/env bash
set -euo pipefail

for db in anpardaz ansarraf platform accounting banner hoosh market financial
do

echo
echo "===== $db ====="

find databases/$db \
-maxdepth 1 \
-name "*.sql" \
-printf "%f\n" \
| sed -E 's/^([0-9]+)_.*/\1/' \
| sort \
| uniq -d

done
