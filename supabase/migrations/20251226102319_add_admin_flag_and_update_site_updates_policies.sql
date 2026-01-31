/*
  # Add Admin Flag and Update Site Updates Policies

  1. Changes to `profiles` table
    - Add `is_admin` (boolean) column with default false
    - This allows certain users to manage site updates

  2. Update Security on `site_updates` table
    - Update INSERT policy to allow admins to create updates
    - Update UPDATE policy to allow admins to modify updates
    - Update DELETE policy to allow admins to delete updates

  3. Notes
    - Only users with is_admin = true can manage site updates
    - All authenticated users can still read updates
    - Admin status must be set manually in the database
*/

-- Add is_admin column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only admins can insert site updates" ON site_updates;
DROP POLICY IF EXISTS "Only admins can update site updates" ON site_updates;
DROP POLICY IF EXISTS "Only admins can delete site updates" ON site_updates;

-- Create new admin-based policies
CREATE POLICY "Admins can insert site updates"
  ON site_updates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update site updates"
  ON site_updates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete site updates"
  ON site_updates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
