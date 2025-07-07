-- Add avatar_url to profiles table
ALTER TABLE public.profiles
ADD COLUMN avatar_url TEXT;

COMMENT ON COLUMN public.profiles.avatar_url IS 'URL for the user''s avatar image.';