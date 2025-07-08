-- This migration consolidates several previous migrations to clean up the timeline.
-- It includes:
-- 1. Name length constraints for folders and tags.
-- 2. The final, robust username creation logic based on email.
-- 3. The new 'banner_color' column for user profiles.

-- ========= 1. Name Length Constraints =========
-- First, delete any existing folders or tags that violate the new constraints
DELETE FROM public.saved_folders WHERE LENGTH(name) > 25;
DELETE FROM public.saved_tags WHERE LENGTH(name) > 15;

-- Add check constraint for saved_folders name length
ALTER TABLE public.saved_folders
ADD CONSTRAINT check_folder_name_length
CHECK (length(name) <= 25);

-- Add check constraint for saved_tags name length
ALTER TABLE public.saved_tags
ADD CONSTRAINT check_tag_name_length
CHECK (length(name) <= 15);


-- ========= 2. Add Banner Color =========
-- Add banner_color to profiles table with a default value (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'banner_color'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN banner_color TEXT DEFAULT '#3B82F6' NOT NULL;
    END IF;
END $$;


-- ========= 3. Final Username Creation & handle_new_user function =========
-- Drop and recreate the trigger to ensure it uses the latest function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function with all consolidated logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  email_prefix text;
  final_username text;
  attempt_count integer := 0;
  max_attempts integer := 10;
BEGIN
  -- Extract the part before @ from email
  email_prefix := split_part(new.email, '@', 1);
  
  -- Ensure the username is at least 3 characters long
  IF char_length(email_prefix) < 3 THEN
    final_username := email_prefix || '123';
  ELSE
    final_username := email_prefix;
  END IF;
  
  -- Try to insert profile with email prefix as username
  LOOP
    BEGIN
      INSERT INTO public.profiles (
        id, 
        username, 
        role, 
        has_completed_onboarding, 
        analytics_data, 
        saved_articles_limit,
        banner_color -- Added this line
      )
      VALUES (
        new.id, 
        CASE 
          WHEN attempt_count = 0 THEN final_username
          ELSE final_username || attempt_count::text
        END,
        'user',         -- Default role
        false,          -- Default onboarding status
        '{}'::jsonb,    -- Default empty analytics
        50,             -- Default article limit
        '#3B82F6'       -- Default banner color
      );
      
      EXIT; -- Exit loop if successful
      
    EXCEPTION
      WHEN unique_violation THEN
        attempt_count := attempt_count + 1;
        IF attempt_count >= max_attempts THEN
          -- Fallback to a random username if we can't find a unique one
          INSERT INTO public.profiles (
            id, 
            username, 
            role, 
            has_completed_onboarding, 
            analytics_data, 
            saved_articles_limit,
            banner_color -- Added this line
          )
          VALUES (
            new.id, 
            final_username || '_' || floor(random() * 10000)::text,
            'user',
            false,
            '{}'::jsonb,
            50,
            '#3B82F6'
          );
          EXIT; -- Exit loop after fallback
        END IF;
    END;
  END LOOP;

  -- Create default folders for the new user
  INSERT INTO public.saved_folders (user_id, name, description, color)
  VALUES
    (new.id, 'Read Later', 'Default folder for saved articles', '#3B82F6'),
    (new.id, 'Favorites', 'Your favorite articles', '#EF4444');

  -- Create default tags for the new user
  INSERT INTO public.saved_tags (user_id, name, color)
  VALUES
    (new.id, 'Important', '#EF4444'),
    (new.id, 'To Review', '#F59E0B');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Drop old RLS policy for profiles and create a new one that covers all columns
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
CREATE POLICY "Enable update for users based on email"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);