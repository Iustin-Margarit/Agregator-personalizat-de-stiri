-- Recreate the get_all_sources function to fix a datatype mismatch.
-- The function was not updated to include the new 'is_enabled' column.
-- This version adds 'is_enabled' to the function's return table definition.
CREATE OR REPLACE FUNCTION public.get_all_sources()
RETURNS TABLE (
  id UUID,
  name TEXT,
  url TEXT,
  is_enabled BOOLEAN,
  category_id INT,
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