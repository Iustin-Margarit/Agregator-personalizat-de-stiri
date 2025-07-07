-- Drop the existing policies so we can recreate them with admin overrides.
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

-- Allow users to view their own profile, and allow admins to view any profile.
CREATE POLICY "Users can view profiles."
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id OR
    public.is_admin(auth.uid())
  );

-- Allow users to update their own profile, and allow admins to update any profile.
-- This is important for the User Management page.
CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id OR
    public.is_admin(auth.uid())
  )
  WITH CHECK (
    auth.uid() = id OR
    public.is_admin(auth.uid())
  );