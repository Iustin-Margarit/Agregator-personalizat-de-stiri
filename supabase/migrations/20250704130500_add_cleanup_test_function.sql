-- This script creates a "dry run" function to test the article cleanup logic
-- without deleting any data.

CREATE OR REPLACE FUNCTION test_article_cleanup_dry_run()
RETURNS TABLE(
    article_id uuid, 
    article_title text, 
    article_created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id, 
    title,
    created_at
  FROM 
    public.articles
  WHERE 
    created_at < now() - interval '30 days'
    AND id NOT IN (SELECT sa.article_id FROM public.saved_articles sa);
END;
$$ LANGUAGE plpgsql;

-- To use this function, run the following query in the Supabase SQL Editor:
-- SELECT * FROM test_article_cleanup_dry_run();