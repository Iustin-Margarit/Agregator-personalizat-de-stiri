-- Drop and recreate get_user_visible_articles function to include slug field
-- We need to drop first because PostgreSQL doesn't allow changing return types
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
  LEFT JOIN public.saved_articles sa ON (a.id = sa.article_id AND sa.user_id = p_user_id)
  WHERE
    a.source_id = ANY(p_source_ids)
    AND (
      -- Show recent articles (within 30 days) to everyone
      a.created_at >= now() - interval '30 days'
      OR
      -- Show saved articles regardless of age
      sa.article_id IS NOT NULL
    )
  ORDER BY
    -- Prioritize saved articles, then by published date
    CASE WHEN sa.article_id IS NOT NULL THEN 0 ELSE 1 END,
    a.published_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_visible_articles(uuid, uuid[], integer, integer) TO authenticated;

-- Update comment
COMMENT ON FUNCTION get_user_visible_articles IS
'Returns articles visible to a specific user: recent articles (< 30 days) for everyone, plus saved articles regardless of age. Includes slug field for SEO-friendly URLs.';