-- Add a unique constraint to the sources table on the name column to prevent duplicate source names.
ALTER TABLE public.sources ADD CONSTRAINT sources_name_key UNIQUE (name);

-- Ensure the 'Forbes - Business' source is correctly defined.
-- If a source with this name already exists, it will be updated. Otherwise, it will be inserted.
INSERT INTO public.sources (name, url, rss_url, description, website_url, category_id)
VALUES (
    'Forbes - Business',
    'https://www.forbes.com',
    'https://www.forbes.com/business/feed/',
    'Business news and analysis from Forbes',
    'https://www.forbes.com',
    (SELECT id FROM public.categories WHERE name = 'Business')
)
ON CONFLICT (name) DO UPDATE SET
    url = 'https://www.forbes.com',
    rss_url = 'https://www.forbes.com/business/feed/',
    description = 'Business news and analysis from Forbes',
    website_url = 'https://www.forbes.com';

-- Ensure the 'MarketWatch - Business News' source is correctly defined.
-- If a source with this name already exists, no action will be taken. Otherwise, it will be inserted.
INSERT INTO public.sources (name, url, rss_url, description, website_url, category_id)
VALUES (
    'MarketWatch - Business News',
    'http://www.marketwatch.com',
    'http://feeds.marketwatch.com/marketwatch/realtimeheadlines/',
    'Business news, financial news, and stock market data from MarketWatch',
    'http://www.marketwatch.com',
    (SELECT id FROM public.categories WHERE name = 'Business')
)
ON CONFLICT (name) DO NOTHING;

-- Update articles that are from Forbes but may have the wrong source_id.
-- This identifies articles with 'forbes.com' in their URL and assigns them the correct source_id.
WITH forbes_source AS (
  SELECT id FROM public.sources WHERE name = 'Forbes - Business'
)
UPDATE public.articles
SET source_id = (SELECT id FROM forbes_source)
WHERE url LIKE '%forbes.com%' AND source_id != (SELECT id FROM forbes_source);