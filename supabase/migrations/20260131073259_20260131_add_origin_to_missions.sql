/*
  # Add Origin Field to Missions Table

  1. Changes
    - Add `origin` column to vextor_missions table
      - Type: text
      - Used to track the starting location of a mission
      - Complements the existing `destination` field

  2. Important Notes
    - This field is required for complete mission tracking
    - Allows calculation of actual round-trip logistics
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vextor_missions' AND column_name = 'origin'
  ) THEN
    ALTER TABLE vextor_missions ADD COLUMN origin text;
  END IF;
END $$;
