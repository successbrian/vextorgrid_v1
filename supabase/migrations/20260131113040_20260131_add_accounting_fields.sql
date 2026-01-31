/*
  # Add Accounting Fields for Missions and Fuel

  1. Mission Table Updates
    - Add `load_id` column for Load ID / Rate Con #
    - Add `is_factored` column for Factoring status

  2. Fuel Logs Table Updates
    - Add `merchant` column for fuel station merchant info
    - Example values: Loves, Pilot, Flying J, Shell, Chevron, etc.

  3. Security
    - Fields have appropriate defaults
    - No RLS changes needed as tables already have RLS enabled
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vextor_missions' AND column_name = 'load_id'
  ) THEN
    ALTER TABLE vextor_missions ADD COLUMN load_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vextor_missions' AND column_name = 'is_factored'
  ) THEN
    ALTER TABLE vextor_missions ADD COLUMN is_factored boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vextor_fuel_logs' AND column_name = 'merchant'
  ) THEN
    ALTER TABLE vextor_fuel_logs ADD COLUMN merchant text;
  END IF;
END $$;