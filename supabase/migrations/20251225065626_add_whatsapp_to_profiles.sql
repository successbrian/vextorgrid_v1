/*
  # Add WhatsApp number to profiles

  1. Changes
    - Add `whatsapp_number` column to the `profiles` table
      - Type: text (allows international format with country codes)
      - Optional field (can be null)
      - Allows users to provide their WhatsApp contact during signup
  
  2. Notes
    - WhatsApp number is stored as text to accommodate various international formats
    - No validation is enforced at database level to allow flexibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'whatsapp_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN whatsapp_number text;
  END IF;
END $$;