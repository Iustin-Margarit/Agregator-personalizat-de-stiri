-- Clean up existing miscategorized NY Post articles
-- This attempts to recategorize existing articles based on their URLs and content

-- Get the old NY Post source ID for reference
DO $$
DECLARE
    old_nypost_source_id UUID;
    sports_source_id UUID;
    business_source_id UUID;
    entertainment_source_id UUID;
    news_source_id UUID;
    sports_updated INTEGER := 0;
    business_updated INTEGER := 0;
    entertainment_updated INTEGER := 0;
BEGIN
    -- Get source IDs
    SELECT id INTO old_nypost_source_id FROM public.sources WHERE name LIKE 'New York Post%DEPRECATED%' OR name = 'New York Post';
    SELECT id INTO sports_source_id FROM public.sources WHERE name = 'New York Post - Sports';
    SELECT id INTO business_source_id FROM public.sources WHERE name = 'New York Post - Business';
    SELECT id INTO entertainment_source_id FROM public.sources WHERE name = 'New York Post - Entertainment';
    SELECT id INTO news_source_id FROM public.sources WHERE name = 'New York Post - News';
    
    -- Update sports articles (URLs containing /sports/ or sports keywords in title)
    UPDATE public.articles
    SET source_id = sports_source_id
    WHERE source_id = old_nypost_source_id
      AND (url LIKE '%nypost.com/2025/%/sports/%'
           OR url LIKE '%nypost.com/sports/%'
           OR title ILIKE '%UFC%'
           OR title ILIKE '%NFL%'
           OR title ILIKE '%NBA%'
           OR title ILIKE '%MLB%'
           OR title ILIKE '%hockey%'
           OR title ILIKE '%football%'
           OR title ILIKE '%basketball%'
           OR title ILIKE '%baseball%'
           OR title ILIKE '%soccer%'
           OR title ILIKE '%tennis%'
           OR title ILIKE '%golf%'
           OR title ILIKE '%boxing%'
           OR title ILIKE '%MMA%'
           OR title ILIKE '%wrestling%');
    
    GET DIAGNOSTICS sports_updated = ROW_COUNT;

    -- Update business articles (URLs containing /business/)
    UPDATE public.articles
    SET source_id = business_source_id
    WHERE source_id = old_nypost_source_id
      AND (url LIKE '%nypost.com/2025/%/business/%'
           OR url LIKE '%nypost.com/business/%');
    
    GET DIAGNOSTICS business_updated = ROW_COUNT;

    -- Update entertainment articles (URLs containing /entertainment/)
    UPDATE public.articles
    SET source_id = entertainment_source_id
    WHERE source_id = old_nypost_source_id
      AND (url LIKE '%nypost.com/2025/%/entertainment/%'
           OR url LIKE '%nypost.com/entertainment/%');
    
    GET DIAGNOSTICS entertainment_updated = ROW_COUNT;

    -- Update remaining NY Post articles to the News source
    UPDATE public.articles
    SET source_id = news_source_id
    WHERE source_id = old_nypost_source_id;

    -- Log the changes made
    RAISE NOTICE 'NY Post article recategorization complete:';
    RAISE NOTICE '- Sports articles moved: %', sports_updated;
    RAISE NOTICE '- Business articles moved: %', business_updated;
    RAISE NOTICE '- Entertainment articles moved: %', entertainment_updated;
    RAISE NOTICE 'Remaining articles moved to News category';
END $$;