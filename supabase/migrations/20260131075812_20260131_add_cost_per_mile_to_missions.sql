/*
  # Add cost_per_mile column to missions table

  1. Changes
    - Add `cost_per_mile` column to `vextor_missions` table
    - Used to calculate cost per mile for delivery missions
    - Will be calculated as offer_amount / estimated_miles

  2. Important Notes
    - Column is nullable to support existing missions
    - New missions will always populate this field
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vextor_missions' AND column_name = 'cost_per_mile'
  ) THEN
    ALTER TABLE vextor_missions ADD COLUMN cost_per_mile numeric;
  END IF;
END $$;