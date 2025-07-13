-- Recreate the function to update a user's role with enhanced security checks.
-- This version prevents an admin from demoting themselves if they are the last admin,
-- thus preventing a lockout scenario.
CREATE OR REPLACE FUNCTION public.update_user_role(
  p_user_id UUID,
  p_new_role TEXT
)
RETURNS VOID AS $$
DECLARE
  admin_count INT;
BEGIN
  -- Security Check: Only allow admins to execute this function.
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can change user roles.';
  END IF;

  -- Validate the new role to ensure it's a valid value.
  IF p_new_role NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'Invalid role specified. Must be ''user'' or ''admin''.';
  END IF;

  -- **Critical Security Check:** Prevent the last admin from being demoted.
  IF (SELECT role FROM public.profiles WHERE id = p_user_id) = 'admin' AND p_new_role = 'user' THEN
    SELECT count(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
    IF admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot demote the last admin.';
    END IF;
  END IF;

  -- Update the user's role in the profiles table.
  UPDATE public.profiles
  SET role = p_new_role
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions do not need to be re-granted as we are using CREATE OR REPLACE.

COMMENT ON FUNCTION public.update_user_role(UUID, TEXT) IS 'Admin-only function to update a user''s role. Includes a check to prevent demoting the last admin.';