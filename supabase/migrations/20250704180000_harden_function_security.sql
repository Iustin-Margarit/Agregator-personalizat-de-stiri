-- Harden security for database functions by setting a non-mutable search_path
-- This resolves the "function_search_path_mutable" warnings from the Supabase linter.

-- 1. Secure the handle_new_user function
-- This function is responsible for creating a user profile when a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

-- 2. Secure the update_updated_at_column function
-- This is a utility trigger function to update the 'updated_at' timestamp on rows.
-- Note: We are assuming this function exists. If it was part of another migration,
-- this will correctly replace it. If it doesn't exist, this will create it securely.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 3. Secure the delete_old_articles function
-- This function is used by the cron job to clean up articles older than 30 days.
CREATE OR REPLACE FUNCTION public.delete_old_articles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.articles
  WHERE
    created_at < now() - interval '30 days'
    AND id NOT IN (SELECT article_id FROM public.saved_articles);
END;
$$;

-- 4. Secure the test_article_cleanup_dry_run function
-- This is a helper function for testing the article cleanup logic.
CREATE OR REPLACE FUNCTION public.test_article_cleanup_dry_run()
RETURNS TABLE(
    article_id uuid,
    article_title text,
    article_created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;