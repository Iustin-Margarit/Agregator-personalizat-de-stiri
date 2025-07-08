-- Force the email-based username creation to be the final version
-- This migration ensures our email-based username creation overrides all previous versions

-- Drop and recreate the trigger to ensure it uses the latest function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function with email-based username logic
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
  -- If email prefix is too short, append numbers
  IF char_length(email_prefix) < 3 THEN
    final_username := email_prefix || '123';
  ELSE
    final_username := email_prefix;
  END IF;
  
  -- Try to insert profile with email prefix as username
  -- Use a loop to handle potential conflicts
  LOOP
    BEGIN
      INSERT INTO public.profiles (
        id, 
        username, 
        role, 
        has_completed_onboarding, 
        analytics_data, 
        saved_articles_limit
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
        50              -- Default article limit
      );
      
      -- If we get here, the insert was successful
      EXIT;
      
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
            saved_articles_limit
          )
          VALUES (
            new.id, 
            final_username || '_' || floor(random() * 10000)::text,
            'user',         -- Default role
            false,          -- Default onboarding status
            '{}'::jsonb,    -- Default empty analytics
            50              -- Default article limit
          );
          EXIT;
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