/*
  # Add Command HUD Fields to Profiles

  1. Changes
    - Add `home_zip_code` (text) - Stores user's home location for weather data
    - Add `last_active_at` (timestamptz) - Tracks last user activity for grid status
    - Add `clock_config` (jsonb) - Stores user's custom time zone configurations
  
  2. Security
    - No RLS changes needed (profiles table already has RLS enabled)
    - Users can only update their own profile data
  
  3. Notes
    - `clock_config` will store an array of objects: [{ timezone: 'America/New_York', label: 'HQ' }]
    - `last_active_at` will be updated on every page load via the AuthContext
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'home_zip_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN home_zip_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_active_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_active_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'clock_config'
  ) THEN
    ALTER TABLE profiles ADD COLUMN clock_config jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
