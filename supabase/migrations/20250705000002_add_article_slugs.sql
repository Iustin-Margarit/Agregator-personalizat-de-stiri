-- Add slug column to articles table
ALTER TABLE public.articles ADD COLUMN slug text;

-- Create unique index on slug (allowing nulls for now)
CREATE UNIQUE INDEX articles_slug_unique_idx ON public.articles (slug) WHERE slug IS NOT NULL;

-- Function to generate URL-friendly slug from title
CREATE OR REPLACE FUNCTION generate_slug(title text)
RETURNS text AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(title, '[^\w\s-]', '', 'g'), -- Remove special chars except word chars, spaces, hyphens
            '\s+', '-', 'g'                             -- Replace spaces with hyphens
          ),
          '-+', '-', 'g'                                -- Replace multiple hyphens with single
        ),
        '^-|-$', '', 'g'                                -- Remove leading/trailing hyphens
      ),
      '.{100}.*', '\1'                                  -- Truncate to 100 chars
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate unique slug for an article
CREATE OR REPLACE FUNCTION generate_unique_slug(article_title text, article_id uuid DEFAULT NULL)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
  slug_exists boolean;
BEGIN
  -- Generate base slug from title
  base_slug := generate_slug(article_title);
  
  -- If base slug is empty, use 'article' as fallback
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'article';
  END IF;
  
  final_slug := base_slug;
  
  -- Check if slug exists (excluding current article if updating)
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM public.articles 
      WHERE slug = final_slug 
      AND (article_id IS NULL OR id != article_id)
    ) INTO slug_exists;
    
    EXIT WHEN NOT slug_exists;
    
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Generate slugs for existing articles
UPDATE public.articles 
SET slug = generate_unique_slug(title, id)
WHERE slug IS NULL;

-- Add constraint to ensure slug is not null for new articles
ALTER TABLE public.articles ALTER COLUMN slug SET NOT NULL;

-- Create trigger to automatically generate slug for new articles
CREATE OR REPLACE FUNCTION set_article_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate slug if not provided or if title changed
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.title != NEW.title AND NEW.slug = OLD.slug) THEN
    NEW.slug := generate_unique_slug(NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_set_slug_trigger
  BEFORE INSERT OR UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION set_article_slug();

-- Add comment
COMMENT ON COLUMN public.articles.slug IS 'URL-friendly slug generated from article title';