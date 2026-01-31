/*
  # VextorGrid V1.0 Structural Updates
  
  1. New Columns Added
    - `vextor_missions`: Add `is_paid` (boolean, default false) for cash flow tracking
    - `vextor_vehicles`: Add `fuel_type` (text, default 'Diesel') for EV/Hybrid prep
  
  2. Modified Tables
    - `vextor_missions`:
      - New column `is_paid` - tracks whether mission earnings have been paid by broker
      - Enables split of Total Earnings into Paid vs Accounts Receivable
    - `vextor_vehicles`:
      - New column `fuel_type` - allows tracking of Diesel, Electric, Hybrid
      - Future-proofs V3.0 efficiency calculations
  
  3. Important Notes
    - Existing missions default to is_paid = false (unpaid)
    - Existing vehicles default to fuel_type = 'Diesel'
    - No data loss; backward compatible
    - RLS policies remain unchanged
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vextor_missions' AND column_name = 'is_paid'
  ) THEN
    ALTER TABLE vextor_missions ADD COLUMN is_paid boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vextor_vehicles' AND column_name = 'fuel_type'
  ) THEN
    ALTER TABLE vextor_vehicles ADD COLUMN fuel_type text DEFAULT 'Diesel';
  END IF;
END $$;
