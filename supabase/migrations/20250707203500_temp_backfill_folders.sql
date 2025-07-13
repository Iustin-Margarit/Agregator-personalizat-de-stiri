-- This is a one-time script to backfill default folders and tags for existing users who do not have them.
-- It is safe to run multiple times, as the WHERE NOT EXISTS clause prevents duplicates.
-- This migration is kept in the history to ensure all future database setups are consistent.

-- Backfill "Read Later" and "Favorites" folders
INSERT INTO public.saved_folders (user_id, name, description, color)
SELECT 
    p.id, 
    'Read Later', 
    'Default folder for saved articles', 
    '#3B82F6'
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.saved_folders sf WHERE sf.user_id = p.id AND sf.name = 'Read Later'
);

INSERT INTO public.saved_folders (user_id, name, description, color)
SELECT 
    p.id, 
    'Favorites', 
    'Your favorite articles', 
    '#EF4444'
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.saved_folders sf WHERE sf.user_id = p.id AND sf.name = 'Favorites'
);

-- Backfill "Important" and "To Review" tags
INSERT INTO public.saved_tags (user_id, name, color)
SELECT 
    p.id, 
    'Important', 
    '#EF4444'
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.saved_tags st WHERE st.user_id = p.id AND st.name = 'Important'
);

INSERT INTO public.saved_tags (user_id, name, color)
SELECT 
    p.id, 
    'To Review', 
    '#F59E0B'
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.saved_tags st WHERE st.user_id = p.id AND st.name = 'To Review'
);