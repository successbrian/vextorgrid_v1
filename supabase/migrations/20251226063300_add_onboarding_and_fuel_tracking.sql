/*
  # Add Onboarding and Fuel Tracking System

  1. Changes to `profiles` table
    - `user_role` (text, default 'personal') - User's role: personal, professional, or fleet_manager
    - `onboarding_completed` (boolean, default false) - Tracks if user has completed onboarding

  2. Changes to `vehicles` table
    - `year` (integer) - Vehicle year
    - `make` (text) - Vehicle make/manufacturer
    - `model` (text) - Vehicle model
    - `oil_change_interval` (integer, default 5000) - Miles between oil changes
    - `current_odometer` (integer, default 0) - Current odometer reading
    - Remove `mpg` column (will be calculated from fuel logs)
    - Update `name` to be generated from year/make/model

  3. New Table: `fuel_logs`
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to auth.users)
    - `vehicle_id` (uuid, foreign key to vehicles)
    - `odometer_reading` (integer, not null) - Odometer at fill-up
    - `gallons_added` (numeric, not null) - Gallons of fuel added
    - `total_cost` (numeric, not null) - Total cost of fuel
    - `trip_miles` (integer) - Calculated miles since last fill-up
    - `mpg` (numeric) - Calculated miles per gallon
    - `created_at` (timestamptz, default now())

  4. Security
    - Enable RLS on fuel_logs table
    - Add policies for authenticated users to manage their own fuel logs
    - Users can only access fuel logs for their own vehicles

  5. Important Notes
    - MPG is now calculated dynamically from fuel logs, not stored in vehicles
    - Odometer is automatically updated when a fuel log is added
    - First fuel log entry won't have trip_miles or mpg (no previous reading)
*/

-- Add columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'user_role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN user_role text DEFAULT 'personal';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;
END $$;

-- Add columns to vehicles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'year'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN year integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'make'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN make text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'model'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN model text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'oil_change_interval'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN oil_change_interval integer DEFAULT 5000;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'current_odometer'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN current_odometer integer DEFAULT 0;
  END IF;
END $$;

-- Drop mpg column from vehicles if it exists (we'll calculate it from fuel logs)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'mpg'
  ) THEN
    ALTER TABLE vehicles DROP COLUMN mpg;
  END IF;
END $$;

-- Create fuel_logs table
CREATE TABLE IF NOT EXISTS fuel_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  odometer_reading integer NOT NULL,
  gallons_added numeric NOT NULL,
  total_cost numeric NOT NULL,
  trip_miles integer,
  mpg numeric,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on fuel_logs
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;

-- Fuel logs policies
CREATE POLICY "Users can view own fuel logs"
  ON fuel_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fuel logs"
  ON fuel_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fuel logs"
  ON fuel_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own fuel logs"
  ON fuel_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_fuel_logs_user_id ON fuel_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle_id ON fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_created_at ON fuel_logs(created_at DESC);