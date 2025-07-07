-- Function to count a user's saved articles that are from disabled sources.
-- This is used to determine if the "Inform and Ask" banner should be shown.
CREATE OR REPLACE FUNCTION public.get_disabled_saved_article_count(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT count(*)
  INTO v_count
  FROM public.saved_articles sa
  JOIN public.articles a ON sa.article_id = a.id
  JOIN public.sources s ON a.source_id = s.id
  WHERE sa.user_id = p_user_id
    AND s.is_enabled = false;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.get_disabled_saved_article_count(UUID) TO authenticated;
COMMENT ON FUNCTION public.get_disabled_saved_article_count(UUID) IS 'Counts how many of a user''s saved articles are from sources that have been disabled.';


-- Function to delete a user's saved articles that are from disabled sources.
-- This is called when the user clicks the "Clear Slots" button.
CREATE OR REPLACE FUNCTION public.delete_disabled_saved_articles(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- We don't need an explicit admin check here, as users should be able to clear their own slots.
  -- The p_user_id is compared against the calling user's ID for security.
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'You can only delete your own saved articles.';
  END IF;

  DELETE FROM public.saved_articles
  WHERE user_id = p_user_id
    AND article_id IN (
      SELECT a.id
      FROM public.articles a
      JOIN public.sources s ON a.source_id = s.id
      WHERE s.is_enabled = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.delete_disabled_saved_articles(UUID) TO authenticated;
COMMENT ON FUNCTION public.delete_disabled_saved_articles(UUID) IS 'Deletes all of a user''s saved articles that are from disabled sources.';