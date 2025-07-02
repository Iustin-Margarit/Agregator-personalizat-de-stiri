-- Fix World category sources that have null category_id
-- This fixes sources that were created before the World category existed

UPDATE public.sources 
SET category_id = (SELECT id FROM public.categories WHERE name = 'World')
WHERE name IN (
    'CBN News - World',
    'New York Post', 
    'The Wall Street Journal - World News',
    'The Hill - World'
) AND category_id IS NULL;
