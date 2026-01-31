/*
  # Add Last Oil Change Tracking

  1. Changes to `vehicles` table
    - `last_oil_change_odometer` (integer, default 0) - Odometer reading at last oil change
    
  2. Important Notes
    - This field tracks when the last oil change was performed
    - Defaults to 0, which means the vehicle needs an oil change soon
    - Users can update this field when they perform an oil change
*/

-- Add last_oil_change_odometer column to vehicles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'last_oil_change_odometer'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN last_oil_change_odometer integer DEFAULT 0;
  END IF;
END $$;