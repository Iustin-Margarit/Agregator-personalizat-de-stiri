-- Delete any existing sports articles to clear potential duplication issues
-- This will allow fresh ingestion of sports content

DELETE FROM public.articles 
WHERE source_id IN (
  SELECT id FROM public.sources 
  WHERE category_id = (SELECT id FROM public.categories WHERE name = 'Sports')
);
