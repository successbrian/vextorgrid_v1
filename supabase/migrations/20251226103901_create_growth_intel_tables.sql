/*
  # Growth & Intel Module - Database Schema

  ## 1. Updates to `profiles` table
    - Add `referral_code` (text, unique, 6-char) for referral system
    - Auto-generate codes for existing users

  ## 2. New Tables

  ### `shouts` table
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to profiles)
    - `message` (text)
    - `created_at` (timestamp)

  ### `field_reports` table
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to profiles)
    - `image_url` (text) - URL to the uploaded image
    - `caption` (text) - User's original caption
    - `status` (enum: PENDING, HOLD, PUBLISHED) - Workflow status
    - `slug` (text, unique) - SEO-friendly URL slug
    - `seo_title` (text) - Admin-edited page title
    - `seo_desc` (text) - Admin-edited meta description
    - `validations` (integer, default 0) - Like count
    - `is_contest_entry` (boolean) - Flag for weekly contest
    - `admin_notes` (text) - Internal admin notes
    - `published_at` (timestamp) - When it was published
    - `created_at` (timestamp)
    - `updated_at` (timestamp)

  ## 3. Security
    - Enable RLS on all tables
    - `shouts`: Everyone can read, authenticated can insert their own
    - `field_reports`: Public can read PUBLISHED, users can manage their own, admins can manage all

  ## 4. Indexes
    - Add indexes on frequently queried columns for performance
*/

-- Add referral_code to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referral_code text UNIQUE;
  END IF;
END $$;

-- Function to generate random 6-character referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Generate referral codes for existing users without one
DO $$
DECLARE
  profile_record RECORD;
  new_code text;
  code_exists boolean;
BEGIN
  FOR profile_record IN SELECT id FROM profiles WHERE referral_code IS NULL LOOP
    LOOP
      new_code := generate_referral_code();
      SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    UPDATE profiles SET referral_code = new_code WHERE id = profile_record.id;
  END LOOP;
END $$;

-- Create shouts table
CREATE TABLE IF NOT EXISTS shouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create status enum type for field_reports
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE report_status AS ENUM ('PENDING', 'HOLD', 'PUBLISHED');
  END IF;
END $$;

-- Create field_reports table
CREATE TABLE IF NOT EXISTS field_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  caption text NOT NULL,
  status report_status DEFAULT 'PENDING' NOT NULL,
  slug text UNIQUE,
  seo_title text,
  seo_desc text,
  validations integer DEFAULT 0 NOT NULL,
  is_contest_entry boolean DEFAULT false NOT NULL,
  admin_notes text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shouts_created_at ON shouts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shouts_user_id ON shouts(user_id);
CREATE INDEX IF NOT EXISTS idx_field_reports_status ON field_reports(status);
CREATE INDEX IF NOT EXISTS idx_field_reports_slug ON field_reports(slug);
CREATE INDEX IF NOT EXISTS idx_field_reports_user_id ON field_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_field_reports_published_at ON field_reports(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_field_reports_validations ON field_reports(validations DESC);

-- Enable RLS
ALTER TABLE shouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shouts
CREATE POLICY "Everyone can read shouts"
  ON shouts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create their own shouts"
  ON shouts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shouts"
  ON shouts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for field_reports
CREATE POLICY "Public can read published reports"
  ON field_reports
  FOR SELECT
  TO anon, authenticated
  USING (status = 'PUBLISHED');

CREATE POLICY "Users can read their own reports"
  ON field_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all reports"
  ON field_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can insert their own reports"
  ON field_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending reports"
  ON field_reports
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'PENDING')
  WITH CHECK (auth.uid() = user_id AND status = 'PENDING');

CREATE POLICY "Admins can update all reports"
  ON field_reports
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

CREATE POLICY "Admins can delete reports"
  ON field_reports
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Function to auto-generate slug from seo_title
CREATE OR REPLACE FUNCTION generate_slug_from_title(title text, report_id uuid)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
  slug_exists boolean;
BEGIN
  -- Create base slug: lowercase, replace spaces/special chars with hyphens
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  -- Ensure uniqueness
  final_slug := base_slug;
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM field_reports 
      WHERE slug = final_slug AND id != report_id
    ) INTO slug_exists;
    
    EXIT WHEN NOT slug_exists;
    
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_field_reports_updated_at
  BEFORE UPDATE ON field_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
