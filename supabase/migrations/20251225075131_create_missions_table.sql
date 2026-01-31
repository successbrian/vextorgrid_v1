/*
  # Create Missions Table

  1. New Tables
    - `missions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `vehicle_id` (uuid, foreign key to vehicles)
      - `destination` (text, not null) - Mission destination/name
      - `offer_amount` (numeric, not null) - Pay for the mission
      - `estimated_miles` (numeric, not null) - Estimated trip miles
      - `fuel_cost_per_gallon` (numeric, not null) - Fuel price at time of mission
      - `estimated_profit` (numeric, not null) - Calculated profit
      - `status` (text, not null) - Mission status: 'active' or 'completed'
      - `actual_miles` (numeric, nullable) - Actual miles driven (filled on completion)
      - `proof_image_url` (text, nullable) - URL to proof of delivery/receipt
      - `completed_at` (timestamptz, nullable) - When mission was completed
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on missions table
    - Add policies for authenticated users to manage their own missions
    - Users can only access their own missions

  3. Important Notes
    - Missions track the entire lifecycle from acceptance to completion
    - Status can be 'active' (in progress) or 'completed'
    - Actual miles and proof image are captured during debrief
    - All monetary values stored as numeric for precision
*/

-- Create missions table
CREATE TABLE IF NOT EXISTS missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  destination text NOT NULL,
  offer_amount numeric NOT NULL,
  estimated_miles numeric NOT NULL,
  fuel_cost_per_gallon numeric NOT NULL,
  estimated_profit numeric NOT NULL,
  status text NOT NULL DEFAULT 'active',
  actual_miles numeric,
  proof_image_url text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add check constraint for status
ALTER TABLE missions ADD CONSTRAINT missions_status_check 
  CHECK (status IN ('active', 'completed'));

-- Enable RLS
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- Missions policies
CREATE POLICY "Users can view own missions"
  ON missions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own missions"
  ON missions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own missions"
  ON missions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own missions"
  ON missions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_missions_user_id ON missions(user_id);
CREATE INDEX IF NOT EXISTS idx_missions_vehicle_id ON missions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
CREATE INDEX IF NOT EXISTS idx_missions_created_at ON missions(created_at DESC);