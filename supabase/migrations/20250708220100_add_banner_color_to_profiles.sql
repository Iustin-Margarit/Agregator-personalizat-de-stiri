-- Add banner_color to profiles table with a default value
ALTER TABLE public.profiles
ADD COLUMN banner_color TEXT DEFAULT '#3B82F6' NOT NULL;

-- Ensure RLS policies are updated to allow users to modify their own banner_color.
-- The existing policies should cover this, but we'll re-affirm the update policy.
-- Re-applying the policy ensures it's aware of the new column, even though it doesn't name columns explicitly.
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
CREATE POLICY "Enable update for users based on email"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Update the handle_new_user function to include the new banner_color field
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
    saved_articles_limit,
    banner_color
  )
  values (
    new.id, 
    'user-' || substr(replace(new.id::text, '-', ''), 1, 12), -- Creates a username like 'user-a1b2c3d4e5f6'
    'user',         -- Default role
    false,          -- Default onboarding status
    '{}'::jsonb,    -- Default empty analytics
    50,             -- Default article limit
    '#3B82F6'       -- Default banner color
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