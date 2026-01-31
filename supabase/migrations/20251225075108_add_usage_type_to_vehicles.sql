/*
  # Add Usage Type to Vehicles Table

  1. Changes
    - Add `usage_type` column to vehicles table
      - Type: text, not null
      - Valid values: 'personal', 'delivery', 'mixed'
      - Default: 'delivery' for existing records
    
  2. Important Notes
    - Usage type determines which features are available in Grid Ops
    - Personal Commuter: Only Fuel & Mileage Log
    - Delivery / Gig: Mission Calculator + Fuel & Mileage Log
    - Mixed Use: Both features available
*/

-- Add usage_type column to vehicles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'usage_type'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN usage_type text NOT NULL DEFAULT 'delivery';
  END IF;
END $$;

-- Add check constraint to ensure only valid usage types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'vehicles' AND constraint_name = 'vehicles_usage_type_check'
  ) THEN
    ALTER TABLE vehicles ADD CONSTRAINT vehicles_usage_type_check 
      CHECK (usage_type IN ('personal', 'delivery', 'mixed'));
  END IF;
END $$;