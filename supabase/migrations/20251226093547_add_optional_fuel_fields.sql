/*
  # Allow Optional Fuel Data for Odometer-Only Entries

  1. Changes
    - Make `gallons_added` nullable in `fuel_logs` table
    - Make `total_cost` nullable in `fuel_logs` table
    - This allows users to log odometer readings without fuel purchases

  2. Notes
    - Existing records remain unchanged
    - MPG calculation will only occur when gallons_added is not null
    - Users can now track odometer readings independently of fuel purchases
*/

ALTER TABLE fuel_logs ALTER COLUMN gallons_added DROP NOT NULL;
ALTER TABLE fuel_logs ALTER COLUMN total_cost DROP NOT NULL;