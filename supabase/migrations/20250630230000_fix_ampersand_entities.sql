-- Fix remaining &#38; entities
UPDATE public.articles 
SET description = REPLACE(description, '&#38;', '&')
WHERE description LIKE '%&#38;%';
