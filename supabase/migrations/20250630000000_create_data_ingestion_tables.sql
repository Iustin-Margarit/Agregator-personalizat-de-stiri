-- Create the sources table for RSS feeds and news sources
CREATE TABLE public.sources (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    url text UNIQUE NOT NULL,
    rss_url text UNIQUE NOT NULL,
    description text,
    website_url text,
    logo_url text,
    is_active boolean NOT NULL DEFAULT true,
    category_id uuid REFERENCES public.categories(id),
    fetch_frequency_hours integer NOT NULL DEFAULT 1,
    last_fetched_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT sources_pkey PRIMARY KEY (id)
);

-- Add comments to the sources table
COMMENT ON TABLE public.sources IS 'Stores news sources and their RSS feed information for data ingestion.';
COMMENT ON COLUMN public.sources.fetch_frequency_hours IS 'How often to fetch from this source (in hours)';
COMMENT ON COLUMN public.sources.last_fetched_at IS 'When this source was last successfully fetched';

-- Enable Row Level Security for the public.sources table
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;

-- Policy for sources table: all users can read sources (needed for displaying source info)
CREATE POLICY "Enable read access for all users" ON public.sources FOR SELECT USING (true);

-- Create the article_categories table for many-to-many relationship
CREATE TABLE public.article_categories (
    article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT article_categories_pkey PRIMARY KEY (article_id, category_id)
);

-- Add comments to the article_categories table
COMMENT ON TABLE public.article_categories IS 'Many-to-many junction table linking articles to multiple categories.';

-- Enable Row Level Security for the public.article_categories table
ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;

-- Policy for article_categories table: all users can read (needed for filtering)
CREATE POLICY "Enable read access for all users" ON public.article_categories FOR SELECT USING (true);

-- Update the articles table to add missing fields for better content management
ALTER TABLE public.articles 
ADD COLUMN content text,
ADD COLUMN content_hash text,
ADD COLUMN source_id uuid REFERENCES public.sources(id),
ADD COLUMN tags text[],
ADD COLUMN reading_time_minutes integer,
ADD COLUMN is_breaking boolean DEFAULT false,
ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

-- Add comments for new articles columns
COMMENT ON COLUMN public.articles.content IS 'Full article content (optional, for articles we can fetch full text)';
COMMENT ON COLUMN public.articles.content_hash IS 'Hash of title+content for duplicate detection';
COMMENT ON COLUMN public.articles.source_id IS 'Reference to the source this article came from';
COMMENT ON COLUMN public.articles.tags IS 'Array of tags for better categorization';
COMMENT ON COLUMN public.articles.reading_time_minutes IS 'Estimated reading time in minutes';
COMMENT ON COLUMN public.articles.is_breaking IS 'Whether this is breaking news';

-- Create indexes for better query performance
CREATE INDEX sources_is_active_idx ON public.sources (is_active);
CREATE INDEX sources_category_id_idx ON public.sources (category_id);
CREATE INDEX sources_last_fetched_idx ON public.sources (last_fetched_at);
CREATE INDEX articles_source_id_idx ON public.articles (source_id);
CREATE INDEX articles_published_at_idx ON public.articles (published_at);
CREATE INDEX articles_content_hash_idx ON public.articles (content_hash);
CREATE INDEX articles_is_breaking_idx ON public.articles (is_breaking);
CREATE INDEX article_categories_category_id_idx ON public.article_categories (category_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON public.sources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
