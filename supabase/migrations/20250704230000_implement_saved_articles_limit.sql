-- Implement 50 saved articles limit per user with automatic cleanup
-- Migration: 20250704230000_implement_saved_articles_limit.sql

-- Create function to enforce saved articles limit with automatic cleanup
CREATE OR REPLACE FUNCTION enforce_saved_articles_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    oldest_article_id UUID;
BEGIN
    -- Count current saved articles for this user
    SELECT COUNT(*) INTO current_count
    FROM saved_articles 
    WHERE user_id = NEW.user_id;
    
    -- If at or over limit, remove oldest saved article(s)
    WHILE current_count >= 50 LOOP
        -- Find the oldest saved article for this user
        SELECT article_id INTO oldest_article_id
        FROM saved_articles 
        WHERE user_id = NEW.user_id
        ORDER BY saved_at ASC
        LIMIT 1;
        
        -- Delete the oldest saved article
        DELETE FROM saved_articles 
        WHERE user_id = NEW.user_id AND article_id = oldest_article_id;
        
        -- Update count
        current_count := current_count - 1;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce limit before insert
CREATE TRIGGER enforce_saved_articles_limit_trigger
    BEFORE INSERT ON saved_articles
    FOR EACH ROW
    EXECUTE FUNCTION enforce_saved_articles_limit();

-- Create function to get saved articles count for a user
CREATE OR REPLACE FUNCTION get_saved_articles_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM saved_articles 
        WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get saved articles with limit info
CREATE OR REPLACE FUNCTION get_user_saved_articles_with_limit(user_uuid UUID)
RETURNS TABLE (
    article_id UUID,
    title TEXT,
    summary TEXT,
    url TEXT,
    image_url TEXT,
    published_at TIMESTAMPTZ,
    source TEXT,
    author TEXT,
    saved_at TIMESTAMPTZ,
    saved_count INTEGER,
    limit_reached BOOLEAN
) AS $$
DECLARE
    current_count INTEGER;
BEGIN
    -- Get current count
    SELECT COUNT(*) INTO current_count
    FROM saved_articles sa
    WHERE sa.user_id = user_uuid;
    
    -- Return saved articles with metadata
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.summary,
        a.url,
        a.image_url,
        a.published_at,
        a.source,
        a.author,
        sa.saved_at,
        current_count,
        (current_count >= 50) as limit_reached
    FROM saved_articles sa
    JOIN articles a ON sa.article_id = a.id
    WHERE sa.user_id = user_uuid
    ORDER BY sa.saved_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_saved_articles_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_saved_articles_with_limit(UUID) TO authenticated;

-- Add index for better performance on saved_at column (for cleanup queries)
CREATE INDEX IF NOT EXISTS saved_articles_user_saved_at_idx ON saved_articles (user_id, saved_at);

-- Add comments
COMMENT ON FUNCTION enforce_saved_articles_limit() IS 'Automatically removes oldest saved articles when user exceeds 50 article limit';
COMMENT ON FUNCTION get_saved_articles_count(UUID) IS 'Returns count of saved articles for a user';
COMMENT ON FUNCTION get_user_saved_articles_with_limit(UUID) IS 'Returns user saved articles with count and limit status';
COMMENT ON TRIGGER enforce_saved_articles_limit_trigger ON saved_articles IS 'Enforces 50 article limit per user with FIFO cleanup';