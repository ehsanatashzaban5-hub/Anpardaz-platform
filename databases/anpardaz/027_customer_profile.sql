BEGIN;

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS national_id TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_anpardaz_customers_phone
  ON customers(phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_anpardaz_customers_national_id
  ON customers(national_id) WHERE national_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_anpardaz_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_anpardaz_customers_national_id ON customers(national_id);

INSERT INTO schema_migrations(version)
VALUES ('027_customer_profile')
ON CONFLICT(version) DO NOTHING;

COMMIT;
