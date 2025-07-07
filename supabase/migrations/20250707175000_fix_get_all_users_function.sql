-- Recreate the get_all_users function to fix a datatype mismatch.
-- The email column in auth.users is character varying(255), but the function was expecting TEXT.
-- This version explicitly casts u.email to TEXT to resolve the error.
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Security Check: Only allow admins to execute this function.
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can access this resource.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    u.email::TEXT, -- Explicitly cast to TEXT
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

-- Permissions do not need to be re-granted as we are using CREATE OR REPLACE.