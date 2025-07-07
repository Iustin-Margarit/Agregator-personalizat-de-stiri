-- Add a column to store the user's saved article limit.
-- This makes the limit configurable per user, allowing for future premium tiers.
-- It defaults to 50 for all existing and new users.

ALTER TABLE public.profiles
ADD COLUMN saved_articles_limit INT NOT NULL DEFAULT 50;

COMMENT ON COLUMN public.profiles.saved_articles_limit IS 'The maximum number of articles a user can save.';