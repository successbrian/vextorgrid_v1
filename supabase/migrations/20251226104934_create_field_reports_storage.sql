/*
  # Field Reports Storage Setup

  1. Storage Bucket
    - Creates 'field-reports' bucket for user-uploaded images
    - Public bucket for easy access to published content
  
  2. Storage Policies
    - Allow authenticated users to upload files
    - Allow public read access to all files
    - Allow users to delete their own files
  
  3. Notes
    - Max file size handled at application level (5MB recommended)
    - Accepted formats: jpg, jpeg, png, gif, webp
*/

-- Create the storage bucket for field reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('field-reports', 'field-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload field report images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'field-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow public read access to all files
CREATE POLICY "Public read access to field report images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'field-reports');

-- Policy: Allow users to delete their own files
CREATE POLICY "Users can delete their own field report images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'field-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow users to update their own files
CREATE POLICY "Users can update their own field report images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'field-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'field-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
