BEGIN;

CREATE OR REPLACE FUNCTION assert_journal_transaction_sufficient(p_transaction_id BIGINT)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  account_row RECORD;
  current_balance NUMERIC(38,18);
  transaction_delta NUMERIC(38,18);
BEGIN
  FOR account_row IN
    SELECT a.id
    FROM ledger_accounts a
    WHERE a.account_type='liability'
      AND a.id IN (
        SELECT DISTINCT e.ledger_account_id
        FROM journal_entries e
        WHERE e.journal_transaction_id=p_transaction_id
      )
    FOR UPDATE
  LOOP
    SELECT COALESCE(SUM(
      CASE WHEN t.status='posted'
        THEN CASE WHEN e.direction='credit' THEN e.amount ELSE -e.amount END
        ELSE 0 END
    ),0)
    INTO current_balance
    FROM ledger_accounts a
    LEFT JOIN journal_entries e ON e.ledger_account_id=a.id
    LEFT JOIN journal_transactions t ON t.id=e.journal_transaction_id
    WHERE a.id=account_row.id;

    SELECT COALESCE(SUM(
      CASE WHEN e.direction='credit' THEN e.amount ELSE -e.amount END
    ),0)
    INTO transaction_delta
    FROM journal_entries e
    WHERE e.journal_transaction_id=p_transaction_id
      AND e.ledger_account_id=account_row.id;

    IF current_balance + transaction_delta < 0 THEN
      RAISE EXCEPTION 'insufficient_ledger_balance';
    END IF;
  END LOOP;
END;
$$;

INSERT INTO schema_migrations(version)
VALUES ('009_liability_balance_integrity')
ON CONFLICT(version) DO NOTHING;

COMMIT;
