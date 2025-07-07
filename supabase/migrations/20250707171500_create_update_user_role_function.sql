-- Create a function to update a user's role, intended for admin use.
-- This function allows an admin to change the role of any user in the system.
CREATE OR REPLACE FUNCTION public.update_user_role(
  p_user_id UUID,
  p_new_role TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Security Check: Only allow admins to execute this function.
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can change user roles.';
  END IF;

  -- Validate the new role to ensure it's a valid value.
  IF p_new_role NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'Invalid role specified. Must be ''user'' or ''admin''.';
  END IF;

  -- Update the user's role in the profiles table.
  UPDATE public.profiles
  SET role = p_new_role
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to authenticated users.
-- The security check inside the function itself will handle the authorization.
GRANT EXECUTE ON FUNCTION public.update_user_role(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.update_user_role(UUID, TEXT) IS 'Admin-only function to update a user''s role.';