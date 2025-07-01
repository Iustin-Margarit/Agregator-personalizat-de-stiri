-- Fix articles table schema to match Edge Function expectations
-- Add missing columns and rename summary to description

-- Add the missing columns
ALTER TABLE public.articles 
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS content_hash text,
  ADD COLUMN IF NOT EXISTS source_id uuid REFERENCES public.sources(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS articles_content_hash_idx ON public.articles(content_hash);
CREATE INDEX IF NOT EXISTS articles_source_id_idx ON public.articles(source_id);
CREATE INDEX IF NOT EXISTS articles_published_at_idx ON public.articles(published_at);

-- Add unique constraint on URL to prevent duplicates
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'articles_url_unique'
    ) THEN
        ALTER TABLE public.articles ADD CONSTRAINT articles_url_unique UNIQUE (url);
    END IF;
END $$;

-- Add unique constraint on content_hash to prevent duplicates
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'articles_content_hash_unique'
    ) THEN
        ALTER TABLE public.articles ADD CONSTRAINT articles_content_hash_unique UNIQUE (content_hash);
    END IF;
END $$;

-- Update RLS policies to allow service role to insert articles
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view articles" ON public.articles;
DROP POLICY IF EXISTS "Service role can manage articles" ON public.articles;

-- Create new policies
CREATE POLICY "Public can view articles" ON public.articles
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage articles" ON public.articles
    FOR ALL USING (auth.role() = 'service_role');

-- Migrate existing data: copy summary to description where description is null
UPDATE public.articles 
SET description = summary 
WHERE description IS NULL AND summary IS NOT NULL;
