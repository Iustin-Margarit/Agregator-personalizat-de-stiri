-- Remove avatar upload functionality and replace with color customization
-- This migration removes the avatar_url column and adds avatar_color column

-- First, add the new avatar_color column
ALTER TABLE public.profiles
ADD COLUMN avatar_color TEXT DEFAULT '#3B82F6';

-- Add comment for the new column
COMMENT ON COLUMN public.profiles.avatar_color IS 'Hex color code for the user''s predefined avatar background.';

-- Remove the old avatar_url column
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS avatar_url;

-- Drop all avatar storage policies
DROP POLICY IF EXISTS "Anyone can view avatars." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their own avatars." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete their own avatar." ON storage.objects;

-- Delete all objects in the avatars bucket first to avoid foreign key constraint
DELETE FROM storage.objects WHERE bucket_id = 'avatars';

-- Remove the avatars bucket
DELETE FROM storage.buckets WHERE id = 'avatars';