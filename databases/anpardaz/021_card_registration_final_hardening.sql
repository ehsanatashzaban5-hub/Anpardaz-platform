BEGIN;

-- Final hardening for the shared An Pardaz bank-card lifecycle.
-- Full PAN is never persisted by this migration; only provider token/reference,
-- last4 and a keyed fingerprint are retained.
CREATE UNIQUE INDEX IF NOT EXISTS uq_card_registration_provider_reference
  ON card_registration_sessions(provider, provider_reference)
  WHERE provider_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cards_customer_registration
  ON cards(customer_id, registration_status, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_card_registration_status_created
  ON card_registration_sessions(status, created_at DESC);

-- Keep lifecycle/audit records queryable for admin/legal reconciliation.
CREATE INDEX IF NOT EXISTS idx_card_lifecycle_provider_reference
  ON card_lifecycle_audit(provider, provider_reference)
  WHERE provider_reference IS NOT NULL;

INSERT INTO schema_migrations(version)
VALUES ('021_card_registration_final_hardening')
ON CONFLICT(version) DO NOTHING;

COMMIT;
