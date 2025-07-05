-- Fix NY Post categorization by using category-specific RSS feeds
-- This replaces the general feed with category-specific feeds

-- First, add the new category-specific NY Post sources
INSERT INTO public.sources (name, url, rss_url, description, website_url, category_id, fetch_frequency_hours) VALUES

-- NY Post Sports
(
    'New York Post - Sports',
    'https://nypost.com/sports/',
    'https://nypost.com/sports/feed/',
    'Sports news from New York Post',
    'https://nypost.com/sports/',
    (SELECT id FROM public.categories WHERE name = 'Sports'),
    1
),

-- NY Post World/News
(
    'New York Post - News',
    'https://nypost.com/news/',
    'https://nypost.com/news/feed/',
    'World and general news from New York Post',
    'https://nypost.com/news/',
    (SELECT id FROM public.categories WHERE name = 'World'),
    1
),

-- NY Post Business
(
    'New York Post - Business',
    'https://nypost.com/business/',
    'https://nypost.com/business/feed/',
    'Business news from New York Post',
    'https://nypost.com/business/',
    (SELECT id FROM public.categories WHERE name = 'Business'),
    1
),

-- NY Post Entertainment
(
    'New York Post - Entertainment',
    'https://nypost.com/entertainment/',
    'https://nypost.com/entertainment/feed/',
    'Entertainment news from New York Post',
    'https://nypost.com/entertainment/',
    (SELECT id FROM public.categories WHERE name = 'Entertainment'),
    1
);

-- Deactivate the old general NY Post source instead of deleting it
-- This preserves existing article references while preventing new articles from this source
UPDATE public.sources
SET is_active = false,
    name = 'New York Post (DEPRECATED - General Feed)',
    description = 'DEPRECATED: General NY Post feed replaced by category-specific feeds'
WHERE name = 'New York Post';