-- This migration fixes the handle_new_user function to correctly insert all required fields with defaults,
-- and also creates default saved folders and tags for a better onboarding experience.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
begin
  -- Create a new profile for the user
  insert into public.profiles (
    id, 
    username, 
    role, 
    has_completed_onboarding, 
    analytics_data, 
    saved_articles_limit
  )
  values (
    new.id, 
    new.email, 
    'user',         -- Default role
    false,          -- Default onboarding status
    '{}'::jsonb,    -- Default empty analytics
    50              -- Default article limit
  );

  -- Create default folders for the new user
  insert into public.saved_folders (user_id, name, description, color)
  values
    (new.id, 'Read Later', 'Default folder for saved articles', '#3B82F6'),
    (new.id, 'Favorites', 'Your favorite articles', '#EF4444');

  -- Create default tags for the new user
  insert into public.saved_tags (user_id, name, color)
  values
    (new.id, 'Important', '#EF4444'),
    (new.id, 'To Review', '#F59E0B');

  return new;
end;
$$ language plpgsql security definer;