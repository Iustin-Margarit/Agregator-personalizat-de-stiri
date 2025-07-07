-- Harden Functions Security by setting a secure search_path for the three remaining vulnerable functions.

-- This migration addresses the final "Function Search Path Mutable" vulnerabilities
-- identified by the Supabase CLI linter.

ALTER FUNCTION public.get_user_saved_articles_with_limit(user_uuid UUID) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.count_user_visible_articles(p_user_id uuid, p_source_ids uuid[]) SET search_path = public;