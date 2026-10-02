BEGIN;
ALTER TABLE forex_bot_requests ADD COLUMN IF NOT EXISTS operation_id TEXT;
ALTER TABLE forex_bot_pnl_events ADD COLUMN IF NOT EXISTS operation_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uq_forex_bot_requests_operation_id ON forex_bot_requests(operation_id) WHERE operation_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_forex_bot_pnl_operation_id ON forex_bot_pnl_events(operation_id) WHERE operation_id IS NOT NULL;
INSERT INTO schema_migrations(version) VALUES ('042_forex_bot_operation_ids') ON CONFLICT(version) DO NOTHING;
COMMIT;