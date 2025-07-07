-- Harden Functions Security by setting a secure search_path

-- This migration addresses the "Function Search Path Mutable" vulnerability
-- identified by the Supabase CLI. By explicitly setting the search_path for each
-- function, we prevent potential security risks where a function could be tricked
-- into executing malicious code by a user who has modified their own search_path.

-- Fixing functions from security_issues.md

ALTER FUNCTION public.is_admin(p_user_id UUID) SET search_path = public;
ALTER FUNCTION public.generate_slug(title text) SET search_path = public;
ALTER FUNCTION public.generate_unique_slug(article_title text, article_id uuid) SET search_path = public;
ALTER FUNCTION public.set_article_slug() SET search_path = public;
ALTER FUNCTION public.get_all_users() SET search_path = public;
ALTER FUNCTION public.update_user_role(p_user_id UUID, p_new_role TEXT) SET search_path = public;
ALTER FUNCTION public.delete_old_articles() SET search_path = public;
ALTER FUNCTION public.update_source_url(p_source_id UUID, p_new_url TEXT) SET search_path = public;
ALTER FUNCTION public.toggle_source_enabled(p_source_id UUID, p_is_enabled BOOLEAN) SET search_path = public;
ALTER FUNCTION public.get_saved_articles_count(p_user_id uuid) SET search_path = public;
ALTER FUNCTION public.get_all_sources() SET search_path = public;
-- Note: get_user_saved_articles_with_limit was likely removed or renamed.
ALTER FUNCTION public.get_user_visible_articles(p_user_id uuid, p_source_ids uuid[], p_limit integer, p_offset integer) SET search_path = public;
ALTER FUNCTION public.can_user_save_article(user_uuid UUID) SET search_path = public;
ALTER FUNCTION public.get_disabled_saved_article_count(p_user_id UUID) SET search_path = public;
ALTER FUNCTION public.delete_disabled_saved_articles(p_user_id UUID) SET search_path = public;
ALTER FUNCTION public.save_article_with_limit_check(user_uuid UUID, article_uuid UUID) SET search_path = public;
ALTER FUNCTION public.remove_oldest_saved_article(user_uuid UUID) SET search_path = public;
-- Note: update_updated_at_column was not found in recent migrations.
-- Note: count_user_visible_articles was not found, likely replaced by more specific functions.