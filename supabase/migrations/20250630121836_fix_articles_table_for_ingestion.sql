-- Fix articles table schema to match ingestion function expectations

-- Add missing columns for ingestion
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS content text,
ADD COLUMN IF NOT EXISTS content_hash text,
ADD COLUMN IF NOT EXISTS source_id uuid REFERENCES public.sources(id);

-- Create index on content_hash for faster duplicate detection
CREATE INDEX IF NOT EXISTS articles_content_hash_idx ON public.articles (content_hash);

-- Create index on source_id for faster queries
CREATE INDEX IF NOT EXISTS articles_source_id_idx ON public.articles (source_id);

-- Update the source column to be nullable since we're now using source_id
ALTER TABLE public.articles ALTER COLUMN source DROP NOT NULL;

-- Add comments for new columns
COMMENT ON COLUMN public.articles.description IS 'Brief description/excerpt of the article';
COMMENT ON COLUMN public.articles.content IS 'Full content of the article';
COMMENT ON COLUMN public.articles.content_hash IS 'Hash for duplicate detection';
COMMENT ON COLUMN public.articles.source_id IS 'Reference to the source this article came from';
