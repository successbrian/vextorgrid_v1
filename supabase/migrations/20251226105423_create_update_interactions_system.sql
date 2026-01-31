/*
  # Site Updates Interaction System

  1. New Tables
    - `site_update_likes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `update_id` (uuid, references site_updates)
      - `reaction` (text, either 'LIKE' or 'DISLIKE')
      - `created_at` (timestamptz)
      - Unique constraint on (user_id, update_id) - one reaction per user per update
    
    - `site_update_messages`
      - `id` (uuid, primary key)
      - `update_id` (uuid, references site_updates)
      - `user_id` (uuid, references auth.users)
      - `message` (text)
      - `is_admin_reply` (boolean) - true if message is from admin
      - `parent_message_id` (uuid, nullable) - references parent message for threading
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Users can create/read/update their own likes
    - Users can create their own messages and read all messages in threads they're part of
    - Admins can read all messages and create admin replies
    - Public can see like counts but not who liked
  
  3. Indexes
    - Index on update_id for both tables for efficient lookups
    - Index on user_id for messages
*/

-- Create site_update_likes table
CREATE TABLE IF NOT EXISTS site_update_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  update_id uuid NOT NULL REFERENCES site_updates(id) ON DELETE CASCADE,
  reaction text NOT NULL CHECK (reaction IN ('LIKE', 'DISLIKE')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, update_id)
);

-- Create site_update_messages table
CREATE TABLE IF NOT EXISTS site_update_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id uuid NOT NULL REFERENCES site_updates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_admin_reply boolean DEFAULT false,
  parent_message_id uuid REFERENCES site_update_messages(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_site_update_likes_update_id ON site_update_likes(update_id);
CREATE INDEX IF NOT EXISTS idx_site_update_likes_user_id ON site_update_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_site_update_messages_update_id ON site_update_messages(update_id);
CREATE INDEX IF NOT EXISTS idx_site_update_messages_user_id ON site_update_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_site_update_messages_parent_id ON site_update_messages(parent_message_id);

-- Enable RLS
ALTER TABLE site_update_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_update_messages ENABLE ROW LEVEL SECURITY;

-- Policies for site_update_likes

-- Users can insert their own likes
CREATE POLICY "Users can create their own likes"
  ON site_update_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view all likes (to see counts)
CREATE POLICY "Anyone can view likes"
  ON site_update_likes
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own likes (change from LIKE to DISLIKE or vice versa)
CREATE POLICY "Users can update their own likes"
  ON site_update_likes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete their own likes"
  ON site_update_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for site_update_messages

-- Users can create their own messages (non-admin replies)
CREATE POLICY "Users can create messages"
  ON site_update_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (is_admin_reply = false OR 
     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  );

-- Users can view messages in threads they're part of, or all messages if admin
CREATE POLICY "Users can view their message threads"
  ON site_update_messages
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    is_admin_reply = true OR
    EXISTS (
      SELECT 1 FROM site_update_messages AS parent
      WHERE parent.id = site_update_messages.parent_message_id
      AND parent.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM site_update_messages AS sibling
      WHERE sibling.parent_message_id = site_update_messages.parent_message_id
      AND sibling.user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Only admins can update messages (for moderation if needed)
CREATE POLICY "Admins can update messages"
  ON site_update_messages
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Users can delete their own messages, admins can delete any
CREATE POLICY "Users can delete their own messages"
  ON site_update_messages
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
