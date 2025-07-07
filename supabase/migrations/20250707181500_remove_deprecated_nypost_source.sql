-- This migration removes the old, deprecated "New York Post (DEPRECATED - General Feed)" source.
-- It was replaced by category-specific feeds and is no longer needed.
-- Deleting it removes confusion from the admin panel.

DELETE FROM public.sources
WHERE name = 'New York Post (DEPRECATED - General Feed)';