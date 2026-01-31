/*
  # Fix missions status constraint

  1. Changes
    - Remove old missions_status_check constraint
    - Ensure vextor_missions_status_check allows all required statuses

  2. Important Notes
    - The old constraint from before table rename was blocking new statuses
    - This migration cleans up the duplicate constraint
*/

DO $$
BEGIN
  ALTER TABLE vextor_missions DROP CONSTRAINT IF EXISTS missions_status_check;
END $$;

DO $$
BEGIN
  ALTER TABLE vextor_missions DROP CONSTRAINT IF EXISTS vextor_missions_status_check;
END $$;

ALTER TABLE vextor_missions ADD CONSTRAINT vextor_missions_status_check
  CHECK (status IN ('active', 'completed', 'pending_pod', 'history'));
