#!/usr/bin/env bash
set -euo pipefail

echo "===== ANPARDAZ 020 ====="

grep -RniE \
"card_lifecycle|shaparak_callback|CREATE TABLE|ALTER TABLE|REFERENCES|CREATE FUNCTION|CREATE TRIGGER" \
databases/anpardaz/020_*.sql


echo
echo "===== ANSARRAF 011 ====="

grep -RniE \
"trade_lifecycle|manual_funding|kyc|CREATE TABLE|ALTER TABLE|REFERENCES|CREATE FUNCTION|CREATE TRIGGER" \
databases/ansarraf/011_*.sql


echo
echo "===== ANSARRAF 040 ====="

grep -RniE \
"market_quote|crypto_deposit|accounting_outbox|CREATE TABLE|ALTER TABLE|REFERENCES|CREATE FUNCTION|CREATE TRIGGER" \
databases/ansarraf/040_*.sql


echo
echo "===== PLATFORM DUPLICATES ====="

grep -RniE \
"CREATE TABLE|ALTER TABLE|REFERENCES|CREATE FUNCTION|CREATE TRIGGER" \
databases/platform/009_*.sql \
databases/platform/010_*.sql \
databases/platform/068_*.sql \
databases/platform/074_*.sql


echo
echo "===== ACCOUNTING DUPLICATES ====="

grep -RniE \
"CREATE TABLE|ALTER TABLE|REFERENCES|CREATE FUNCTION|CREATE TRIGGER" \
databases/accounting/003_*.sql \
databases/accounting/004_*.sql \
databases/accounting/009_*.sql

