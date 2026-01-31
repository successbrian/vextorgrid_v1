/*
  # Create Field Reports Table with Custom Status Enum
  
  1. New Types
    - `report_status` enum for field report status values (PENDING, HOLD, PUBLISHED)
  
  2. New Tables
    - `field_reports`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `image_url` (text)
      - `caption` (text)
      - `status` (report_status enum, default: PENDING)
      - `slug` (text, unique)
      - `seo_title` (text)
      - `seo_desc` (text)
      - `validations` (integer, default: 0)
      - `is_contest_entry` (boolean, default: false)
      - `admin_notes` (text)
      - `published_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  3. Security
    - Enable RLS on `field_reports` table
    - Add policy allowing users to view and edit their own reports
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE report_status AS ENUM ('PENDING', 'HOLD', 'PUBLISHED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS field_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  image_url text,
  caption text,
  status report_status DEFAULT 'PENDING',
  slug text UNIQUE,
  seo_title text,
  seo_desc text,
  validations integer DEFAULT 0,
  is_contest_entry boolean DEFAULT false,
  admin_notes text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE field_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own reports" ON field_reports;

CREATE POLICY "Users can manage their own reports" 
ON field_reports FOR ALL 
USING (auth.uid() = user_id);
