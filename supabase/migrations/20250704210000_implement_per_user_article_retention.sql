-- Implement per-user article retention system
-- This migration creates a system where articles are only visible to users who saved them after 30 days

-- 1. First, let's update the cleanup function to be more conservative
-- We'll only delete articles that are truly orphaned (no saves AND no recent activity)
CREATE OR REPLACE FUNCTION delete_old_articles()
RETURNS void AS $$
BEGIN
  -- Only delete articles that:
  -- 1. Are older than 30 days
  -- 2. Have NO saved_articles entries (no user has saved them)
  -- 3. Are older than 60 days (double safety buffer for truly abandoned articles)
  DELETE FROM public.articles
  WHERE
    created_at < now() - interval '60 days'
    AND id NOT IN (SELECT article_id FROM public.saved_articles);
    
  -- Log the cleanup for monitoring
  RAISE NOTICE 'Cleaned up old articles older than 60 days with no saves';
END;
$$ LANGUAGE plpgsql;

-- 2. Create a function to get user-visible articles
-- This function determines which articles a user should see based on:
-- - Article age (< 30 days for general feed)
-- - User's saved articles (always visible regardless of age)
CREATE OR REPLACE FUNCTION get_user_visible_articles(
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

-- 3. Create RLS policy for the function
-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_visible_articles(uuid, uuid[], integer, integer) TO authenticated;

-- 4. Create a simpler function for counting user-visible articles
CREATE OR REPLACE FUNCTION count_user_visible_articles(
  p_user_id uuid,
  p_source_ids uuid[]
)
RETURNS integer AS $$
DECLARE
  article_count integer;
BEGIN
  SELECT COUNT(*)
  INTO article_count
  FROM public.articles a
  LEFT JOIN public.saved_articles sa ON (a.id = sa.article_id AND sa.user_id = p_user_id)
  WHERE 
    a.source_id = ANY(p_source_ids)
    AND (
      -- Count recent articles (within 30 days)
      a.created_at >= now() - interval '30 days'
      OR 
      -- Count saved articles regardless of age
      sa.article_id IS NOT NULL
    );
    
  RETURN article_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION count_user_visible_articles(uuid, uuid[]) TO authenticated;

-- 5. Create an index to optimize the new queries
CREATE INDEX IF NOT EXISTS articles_created_at_source_id_idx 
ON public.articles (created_at DESC, source_id);

CREATE INDEX IF NOT EXISTS articles_source_id_published_at_idx 
ON public.articles (source_id, published_at DESC);

-- 6. Add a comment explaining the new system
COMMENT ON FUNCTION get_user_visible_articles IS 
'Returns articles visible to a specific user: recent articles (< 30 days) for everyone, plus saved articles regardless of age';

COMMENT ON FUNCTION count_user_visible_articles IS 
'Counts articles visible to a specific user using the same logic as get_user_visible_articles';

-- 7. Update the cleanup job schedule comment
COMMENT ON FUNCTION delete_old_articles IS 
'Deletes articles older than 60 days that have never been saved by any user. Articles with saves are preserved indefinitely.';