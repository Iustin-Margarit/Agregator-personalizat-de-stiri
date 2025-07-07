-- First, drop the existing function to allow for a signature change.
DROP FUNCTION IF EXISTS public.get_all_sources();

-- Recreate the get_all_sources function with the corrected return type for category_id.
CREATE OR REPLACE FUNCTION public.get_all_sources()
RETURNS TABLE (
  id UUID,
  name TEXT,
  url TEXT,
  is_enabled BOOLEAN,
  category_id UUID, -- Corrected from INT to UUID
  category_name TEXT
) AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can access this resource.';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.url,
    s.is_enabled,
    s.category_id,
    c.name as category_name
  FROM
    public.sources s
  JOIN
    public.categories c ON s.category_id = c.id
  ORDER BY
    c.name, s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant execute permission on the function after recreating it.
GRANT EXECUTE ON FUNCTION public.get_all_sources() TO authenticated;