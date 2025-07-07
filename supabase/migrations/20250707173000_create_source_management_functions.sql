-- Function to get all news sources for the admin panel.
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
GRANT EXECUTE ON FUNCTION public.get_all_sources() TO authenticated;
COMMENT ON FUNCTION public.get_all_sources() IS 'Admin-only function to retrieve a list of all news sources.';

-- Function to update a source's URL.
CREATE OR REPLACE FUNCTION public.update_source_url(p_source_id UUID, p_new_url TEXT)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can change source URLs.';
  END IF;

  UPDATE public.sources SET url = p_new_url WHERE id = p_source_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.update_source_url(UUID, TEXT) TO authenticated;
COMMENT ON FUNCTION public.update_source_url(UUID, TEXT) IS 'Admin-only function to update a news source URL.';

-- Function to enable or disable a source.
CREATE OR REPLACE FUNCTION public.toggle_source_enabled(p_source_id UUID, p_is_enabled BOOLEAN)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can enable or disable sources.';
  END IF;

  UPDATE public.sources SET is_enabled = p_is_enabled WHERE id = p_source_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.toggle_source_enabled(UUID, BOOLEAN) TO authenticated;
COMMENT ON FUNCTION public.toggle_source_enabled(UUID, BOOLEAN) IS 'Admin-only function to enable or disable a news source.';