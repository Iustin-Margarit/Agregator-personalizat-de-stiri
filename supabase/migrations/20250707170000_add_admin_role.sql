-- Step 1: Add the 'role' column to the 'profiles' table.
-- This column will store the user's role, defaulting to 'user' for all existing and new users.
-- A CHECK constraint is added to ensure data integrity, only allowing 'user' or 'admin' as values.
ALTER TABLE public.profiles
ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Step 2: Create a security helper function to check if a user is an admin.
-- This function provides a reusable and secure way to verify admin privileges within RLS policies and RPC functions.
-- It checks the 'role' column in the 'profiles' table for the given user ID.
-- The function is defined with `SECURITY DEFINER` to run with the permissions of the user who defined it (the database owner),
-- allowing it to bypass RLS on the `profiles` table to read the role, which is necessary for its operation.
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = p_user_id;
  
  RETURN v_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant execute permission on the function to authenticated users.
-- This allows any logged-in user to have their permissions checked by this function,
-- which is essential for RLS policies to work correctly.
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

COMMENT ON COLUMN public.profiles.role IS 'User role for Role-Based Access Control (RBAC). Can be ''user'' or ''admin''.';
COMMENT ON FUNCTION public.is_admin(UUID) IS 'Checks if a user has the ''admin'' role. Used for RLS policies.';