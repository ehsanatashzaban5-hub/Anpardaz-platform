-- Final safety boundary: no provider withdrawal submission may be queued
-- unless the withdrawal has passed the approval gate in the database.
-- This protects the system even if a future worker or endpoint bypasses
-- the application-level approval checks.

CREATE OR REPLACE FUNCTION ansarraf_guard_provider_withdrawal_submit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  withdrawal_id_value bigint;
  approval_value text;
BEGIN
  IF NEW.event_type <> 'provider.withdrawal.submit' THEN
    RETURN NEW;
  END IF;

  withdrawal_id_value := COALESCE(
    NEW.withdrawal_id,
    NULLIF(NEW.payload->>'withdrawalId', '')::bigint
  );

  IF withdrawal_id_value IS NULL THEN
    RAISE EXCEPTION 'provider_withdrawal_submission_requires_withdrawal_id';
  END IF;

  SELECT approval_status
    INTO approval_value
    FROM withdrawals
   WHERE id = withdrawal_id_value
   FOR UPDATE;

  IF approval_value IS DISTINCT FROM 'APPROVED' THEN
    RAISE EXCEPTION 'provider_withdrawal_submission_requires_approved_withdrawal';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_provider_withdrawal_submit
ON provider_withdrawal_outbox;

CREATE TRIGGER trg_guard_provider_withdrawal_submit
BEFORE INSERT ON provider_withdrawal_outbox
FOR EACH ROW
EXECUTE FUNCTION ansarraf_guard_provider_withdrawal_submit();
