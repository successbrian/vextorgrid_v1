/*
  # Create Active Missions Table

  1. New Tables
    - `active_missions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `vehicle_id` (uuid, references vehicles)
      - `origin` (text) - Starting location
      - `destination` (text) - End location
      - `estimated_miles` (numeric) - Estimated distance
      - `pay_amount` (numeric) - Payment for mission
      - `estimated_cpm` (numeric) - Cost per mile estimate
      - `status` (text) - 'active' or 'completed'
      - `actual_miles` (numeric, nullable) - Actual miles driven
      - `proof_uploaded` (boolean) - Whether proof was uploaded
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on `active_missions` table
    - Add policy for authenticated users to read their own missions
    - Add policy for authenticated users to insert their own missions
    - Add policy for authenticated users to update their own missions
    - Add policy for authenticated users to delete their own missions
*/

CREATE TABLE IF NOT EXISTS active_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  origin text NOT NULL,
  destination text NOT NULL,
  estimated_miles numeric NOT NULL,
  pay_amount numeric NOT NULL,
  estimated_cpm numeric NOT NULL,
  status text NOT NULL DEFAULT 'active',
  actual_miles numeric,
  proof_uploaded boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE active_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own missions"
  ON active_missions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own missions"
  ON active_missions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own missions"
  ON active_missions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own missions"
  ON active_missions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);