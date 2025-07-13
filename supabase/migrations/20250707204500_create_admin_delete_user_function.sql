-- This migration creates a secure function for admins to delete users.

CREATE OR REPLACE FUNCTION public.delete_user(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Security Check: Ensure the person calling this function is an admin.
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can delete users.';
  END IF;

  -- Security Check: Prevent an admin from deleting their own account to avoid lockouts.
  IF auth.uid() = p_user_id THEN
    RAISE EXCEPTION 'Admins cannot delete their own account.';
  END IF;

  -- Delete the user from the auth.users table.
  -- The `on delete cascade` on the `profiles` table and other tables will handle the rest.
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to all authenticated users.
-- The security check inside the function itself handles the authorization.
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;

COMMENT ON FUNCTION public.delete_user(UUID) IS 'Allows an admin to delete a user account.';