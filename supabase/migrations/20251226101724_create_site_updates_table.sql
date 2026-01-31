/*
  # Create Site Updates Table

  1. New Tables
    - `site_updates`
      - `id` (uuid, primary key) - Unique identifier for each update
      - `title` (text) - The title of the update
      - `description` (text) - Description of the update
      - `category` (text) - Category (e.g., 'feature', 'bugfix', 'announcement')
      - `created_at` (timestamptz) - When the update was created
      - `updated_at` (timestamptz) - When the update was last modified

  2. Security
    - Enable RLS on `site_updates` table
    - Add policy for all authenticated users to read updates
    - Add policy for admins to create/update/delete updates (future-proofing)

  3. Notes
    - This table stores roadmap updates and announcements
    - Users can view updates to stay informed about new features
    - The `updated_at` field is used to determine if there are new updates
*/

CREATE TABLE IF NOT EXISTS site_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text DEFAULT 'announcement',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site updates"
  ON site_updates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert site updates"
  ON site_updates
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Only admins can update site updates"
  ON site_updates
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Only admins can delete site updates"
  ON site_updates
  FOR DELETE
  TO authenticated
  USING (false);
