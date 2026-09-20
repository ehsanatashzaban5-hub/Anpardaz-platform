BEGIN;
CREATE TABLE IF NOT EXISTS kyc_profiles (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 customer_id BIGINT NOT NULL UNIQUE REFERENCES customers(id),
 status TEXT NOT NULL DEFAULT 'NOT_REQUIRED' CHECK (status IN ('NOT_REQUIRED','KYC_REQUIRED','DRAFT','SUBMITTED','PROVIDER_CHECKING','PROVIDER_VERIFIED','PROVIDER_REJECTED','REQUIRES_ACTION','ADMIN_REVIEW','APPROVED','REJECTED','VERIFIED')),
 submitted_data_encrypted TEXT,
 submitted_data_hash TEXT,
 provider_code TEXT,
 provider_reference TEXT,
 provider_identity_match BOOLEAN,
 provider_mobile_match BOOLEAN,
 provider_status TEXT,
 provider_checked_at TIMESTAMPTZ,
 admin_id UUID,
 admin_decision_reason TEXT,
 submitted_at TIMESTAMPTZ,
 approved_at TIMESTAMPTZ,
 rejected_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kyc_profiles_status ON kyc_profiles(status,updated_at);
CREATE TABLE IF NOT EXISTS kyc_audit_events (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 kyc_profile_id BIGINT NOT NULL REFERENCES kyc_profiles(id),
 actor_type TEXT NOT NULL CHECK (actor_type IN ('customer','provider','admin','system')),
 actor_id TEXT, action TEXT NOT NULL, previous_status TEXT, new_status TEXT, reason TEXT, operation_id TEXT, provider_reference TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kyc_audit_profile_created ON kyc_audit_events(kyc_profile_id,created_at DESC);
CREATE TABLE IF NOT EXISTS kyc_provider_events (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 kyc_profile_id BIGINT NOT NULL REFERENCES kyc_profiles(id),
 provider_code TEXT NOT NULL, provider_reference TEXT, event_type TEXT NOT NULL,
 identity_match BOOLEAN, mobile_match BOOLEAN, provider_status TEXT, error_code TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO schema_migrations(version) VALUES ('035_kyc_infrastructure') ON CONFLICT(version) DO NOTHING;
COMMIT;