/*
  # Fix Profile Creation Trigger

  1. Problem
    - The handle_new_user trigger was inserting into the old `profiles` table
    - After renaming to `vextor_profiles`, the trigger was inserting into a non-existent table
    - This caused "database error saving new user" errors during signup

  2. Solution
    - Update the handle_new_user() function to insert into vextor_profiles instead of profiles
    - This fixes signup profile creation for all new users
*/

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.vextor_profiles (id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
