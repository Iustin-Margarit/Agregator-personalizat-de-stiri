-- Add the is_enabled column to the sources table.
-- This will allow admins to enable or disable sources from the admin panel.
-- It defaults to TRUE so that all existing sources remain active.
ALTER TABLE public.sources
ADD COLUMN is_enabled BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.sources.is_enabled IS 'Whether the source is currently active for ingestion.';