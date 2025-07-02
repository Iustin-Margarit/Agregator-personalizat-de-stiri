-- Replace Forbes Business feed with a proper business news source
-- Forbes business feed is returning entertainment content instead of business news

UPDATE public.sources 
SET 
  name = 'MarketWatch - Business News',
  url = 'https://www.marketwatch.com',
  rss_url = 'https://feeds.marketwatch.com/marketwatch/realtimeheadlines/',
  description = 'Real-time business and financial news from MarketWatch',
  website_url = 'https://www.marketwatch.com'
WHERE name = 'Forbes - Business';
