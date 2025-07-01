-- Seed initial news sources with their RSS feeds
-- Note: These are real RSS feeds from reputable news sources

INSERT INTO public.sources (name, url, rss_url, description, website_url, category_id, fetch_frequency_hours) VALUES
-- Technology Sources
(
    'TechCrunch',
    'https://techcrunch.com',
    'https://techcrunch.com/feed/',
    'Leading technology and startup news',
    'https://techcrunch.com',
    (SELECT id FROM public.categories WHERE name = 'Technology'),
    1
),
(
    'Ars Technica',
    'https://arstechnica.com',
    'http://feeds.arstechnica.com/arstechnica/index/',
    'Technology news and information',
    'https://arstechnica.com',
    (SELECT id FROM public.categories WHERE name = 'Technology'),
    2
),
(
    'ZDNet',
    'https://www.zdnet.com',
    'https://www.zdnet.com/news/rss.xml',
    'Technology news, analysis, and reviews',
    'https://www.zdnet.com',
    (SELECT id FROM public.categories WHERE name = 'Technology'),
    1
),

-- Business Sources
(
    'The Wall Street Journal - US Business',
    'https://www.wsj.com',
    'https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml',
    'US Business news from The Wall Street Journal',
    'https://www.wsj.com',
    (SELECT id FROM public.categories WHERE name = 'Business'),
    1
),
(
    'Forbes - Business',
    'https://www.forbes.com',
    'https://www.forbes.com/business/feed/',
    'Business news and analysis from Forbes',
    'https://www.forbes.com',
    (SELECT id FROM public.categories WHERE name = 'Business'),
    1
),

-- Science Sources
(
    'Live Science',
    'https://www.livescience.com',
    'https://www.livescience.com/feeds/all',
    'Science news and discoveries',
    'https://www.livescience.com',
    (SELECT id FROM public.categories WHERE name = 'Science'),
    2
),
(
    'New Scientist',
    'https://www.newscientist.com',
    'https://www.newscientist.com/feed/home/',
    'Science news and discoveries from New Scientist',
    'https://www.newscientist.com',
    (SELECT id FROM public.categories WHERE name = 'Science'),
    6
),

-- Health Sources
(
    'STAT News',
    'https://www.statnews.com',
    'https://www.statnews.com/feed/',
    'Health and medicine news from STAT',
    'https://www.statnews.com',
    (SELECT id FROM public.categories WHERE name = 'Health'),
    4
),
(
    'World Health Organization (WHO) - News',
    'https://www.who.int',
    'https://www.who.int/rss-feeds/news-english.xml',
    'Public health news from the World Health Organization',
    'https://www.who.int',
    (SELECT id FROM public.categories WHERE name = 'Health'),
    2
),

-- Sports Sources
(
    'ESPN - Top Headlines',
    'https://www.espn.com',
    'https://www.espn.com/espn/rss/news',
    'Top sports headlines from ESPN',
    'https://www.espn.com',
    (SELECT id FROM public.categories WHERE name = 'Sports'),
    1
),
(
    'CBS Sports - News',
    'https://www.cbssports.com',
    'https://www.cbssports.com/rss/headlines/',
    'Sports news and headlines from CBS Sports',
    'https://www.cbssports.com',
    (SELECT id FROM public.categories WHERE name = 'Sports'),
    1
),
-- Entertainment Sources
(
    'Variety',
    'https://variety.com',
    'https://variety.com/feed/',
    'Entertainment news from Variety',
    'https://variety.com',
    (SELECT id FROM public.categories WHERE name = 'Entertainment'),
    1
),
(
    'The Hollywood Reporter',
    'https://www.hollywoodreporter.com',
    'https://www.hollywoodreporter.com/feed/',
    'Entertainment news from The Hollywood Reporter',
    'https://www.hollywoodreporter.com',
    (SELECT id FROM public.categories WHERE name = 'Entertainment'),
    1
),
(
    'Deadline',
    'https://deadline.com',
    'https://deadline.com/feed/',
    'Entertainment news from Deadline',
    'https://deadline.com',
    (SELECT id FROM public.categories WHERE name = 'Entertainment'),
    1
),

-- World Sources
(
    'CBN News - World',
    'http://www.cbn.com',
    'http://www.cbn.com/cbnnews/world/feed/',
    'World news from CBN News',
    'http://www.cbn.com',
    (SELECT id FROM public.categories WHERE name = 'World'),
    1
),
(
    'New York Post',
    'https://nypost.com',
    'https://nypost.com/feed/',
    'General news from New York Post',
    'https://nypost.com',
    (SELECT id FROM public.categories WHERE name = 'World'),
    1
),
(
    'The Wall Street Journal - World News',
    'https://www.wsj.com/world',
    'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
    'World news from The Wall Street Journal',
    'https://www.wsj.com/world',
    (SELECT id FROM public.categories WHERE name = 'World'),
    1
),
(
    'The Hill - World',
    'https://thehill.com',
    'https://thehill.com/homenews/world/feed/',
    'World news from The Hill',
    'https://thehill.com',
    (SELECT id FROM public.categories WHERE name = 'World'),
    1
);