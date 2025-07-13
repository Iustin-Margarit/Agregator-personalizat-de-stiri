-- Drop and recreate the function to enforce the is_enabled flag from the sources table.
DROP FUNCTION IF EXISTS get_user_visible_articles(uuid, uuid[], integer, integer);

CREATE FUNCTION get_user_visible_articles(
  p_user_id uuid,
  p_source_ids uuid[],
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  summary text,
  url text,
  slug text,
  image_url text,
  published_at timestamptz,
  source_id uuid,
  created_at timestamptz,
  is_saved boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.summary,
    a.url,
    a.slug,
    a.image_url,
    a.published_at,
    a.source_id,
    a.created_at,
    CASE WHEN sa.article_id IS NOT NULL THEN true ELSE false END as is_saved
  FROM public.articles a
  -- Join with sources table to check the is_enabled flag
  JOIN public.sources s ON a.source_id = s.id
  LEFT JOIN public.saved_articles sa ON (a.id = sa.article_id AND sa.user_id = p_user_id)
  WHERE
    -- CRITICAL FIX: Only include articles from enabled sources
    s.is_enabled = true
    AND a.source_id = ANY(p_source_ids)
    AND (
      a.created_at >= now() - interval '30 days'
      OR
      sa.article_id IS NOT NULL
    )
  ORDER BY
    CASE WHEN sa.article_id IS NOT NULL THEN 0 ELSE 1 END,
    a.published_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_visible_articles(uuid, uuid[], integer, integer) TO authenticated;

COMMENT ON FUNCTION get_user_visible_articles IS
'Returns articles visible to a user, ensuring they are from an enabled source. Includes recent articles and all saved articles.';