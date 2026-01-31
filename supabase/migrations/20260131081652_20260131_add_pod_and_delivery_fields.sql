/*
  # Add POD and delivery timestamp fields to missions

  1. Changes
    - Add `pod_required` (boolean, default false) to track if proof of delivery is needed
    - Add `delivery_timestamp` (timestamptz, nullable) to capture completion time
    - Update status check constraint to include 'pending_pod' and 'history' statuses

  2. Modified Tables
    - `vextor_missions`:
      - New column `pod_required` (boolean, DEFAULT false)
      - New column `delivery_timestamp` (timestamptz, nullable)
      - Updated constraint: status can now be 'active', 'completed', 'pending_pod', or 'history'

  3. Important Notes
    - Existing missions default to pod_required = false
    - delivery_timestamp is captured when mission moves to pending_pod or completed
    - Backward compatible with existing data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vextor_missions' AND column_name = 'pod_required'
  ) THEN
    ALTER TABLE vextor_missions ADD COLUMN pod_required boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vextor_missions' AND column_name = 'delivery_timestamp'
  ) THEN
    ALTER TABLE vextor_missions ADD COLUMN delivery_timestamp timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  ALTER TABLE vextor_missions DROP CONSTRAINT IF EXISTS vextor_missions_status_check;
  ALTER TABLE vextor_missions ADD CONSTRAINT vextor_missions_status_check
    CHECK (status IN ('active', 'completed', 'pending_pod', 'history'));
END $$;
