-- Create a function to get all users, intended for admin use.
-- This function will return basic information for all users in the system.
-- It is defined with `SECURITY DEFINER` so that it can bypass RLS on the profiles table,
-- but access is controlled by the `is_admin` check.
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Security Check: Only allow admins to execute this function.
  -- The auth.uid() function gets the ID of the currently authenticated user.
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can access this resource.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    u.email,
    p.role,
    u.created_at
  FROM
    public.profiles p
  JOIN
    auth.users u ON p.id = u.id
  ORDER BY
    u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to authenticated users.
-- The security check inside the function itself will handle the authorization.
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;

COMMENT ON FUNCTION public.get_all_users() IS 'Admin-only function to retrieve a list of all users.';