-- This script creates a scheduled job to delete old, unsaved articles.

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- 1. Create the function to delete old articles
CREATE OR REPLACE FUNCTION delete_old_articles()
RETURNS void AS $$
BEGIN
  DELETE FROM public.articles
  WHERE
    created_at < now() - interval '30 days'
    AND id NOT IN (SELECT article_id FROM public.saved_articles);
END;
$$ LANGUAGE plpgsql;

-- 2. Schedule the function to run once daily
-- Note: pg_cron must be enabled on your Supabase instance.
-- You can do this in the Supabase dashboard under Database > Extensions.
SELECT cron.schedule('daily-article-cleanup', '0 0 * * *', 'SELECT delete_old_articles()');