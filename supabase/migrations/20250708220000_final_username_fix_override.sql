-- Final override to ensure username creation uses email prefix
-- This migration ensures our email-based username creation is the final version
-- and overrides any previous temporary username generation

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  email_prefix text;
  final_username text;
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
      final_username,
      'user',         -- Default role
      false,          -- Default onboarding status
      '{}'::jsonb,    -- Default empty analytics
      50              -- Default article limit
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- If username already exists, append a random number
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
        final_username || floor(random() * 1000)::text,
        'user',         -- Default role
        false,          -- Default onboarding status
        '{}'::jsonb,    -- Default empty analytics
        50              -- Default article limit
      );
  END;

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