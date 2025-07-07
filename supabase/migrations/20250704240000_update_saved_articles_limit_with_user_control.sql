-- Update saved articles limit system to require user confirmation instead of automatic deletion
-- Migration: 20250704240000_update_saved_articles_limit_with_user_control.sql

-- Drop the existing automatic cleanup trigger
DROP TRIGGER IF EXISTS enforce_saved_articles_limit_trigger ON saved_articles;
DROP FUNCTION IF EXISTS enforce_saved_articles_limit();

-- Create function to check if user can save more articles
CREATE OR REPLACE FUNCTION can_user_save_article(user_uuid UUID)
RETURNS TABLE (
    can_save BOOLEAN,
    current_count INTEGER,
    limit_count INTEGER,
    oldest_saved_article_id UUID,
    oldest_saved_article_title TEXT,
    oldest_saved_date TIMESTAMPTZ
) AS $$
DECLARE
    current_count_val INTEGER;
    limit_val INTEGER := 50;
    oldest_id UUID;
    oldest_title TEXT;
    oldest_date TIMESTAMPTZ;
BEGIN
    -- Get current count
    SELECT COUNT(*) INTO current_count_val
    FROM saved_articles sa
    WHERE sa.user_id = user_uuid;
    
    -- Get oldest saved article info
    SELECT sa.article_id, a.title, sa.saved_at 
    INTO oldest_id, oldest_title, oldest_date
    FROM saved_articles sa
    JOIN articles a ON sa.article_id = a.id
    WHERE sa.user_id = user_uuid
    ORDER BY sa.saved_at ASC
    LIMIT 1;
    
    -- Return the information
    RETURN QUERY SELECT 
        (current_count_val < limit_val) as can_save,
        current_count_val,
        limit_val,
        oldest_id,
        oldest_title,
        oldest_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to save article with limit check (returns status)
CREATE OR REPLACE FUNCTION save_article_with_limit_check(
    user_uuid UUID, 
    article_uuid UUID
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    current_count INTEGER,
    limit_reached BOOLEAN
) AS $$
DECLARE
    current_count_val INTEGER;
    limit_val INTEGER := 50;
    already_saved BOOLEAN;
BEGIN
    -- Check if article is already saved
    SELECT EXISTS(
        SELECT 1 FROM saved_articles 
        WHERE user_id = user_uuid AND article_id = article_uuid
    ) INTO already_saved;
    
    IF already_saved THEN
        -- Get current count for response
        SELECT COUNT(*) INTO current_count_val
        FROM saved_articles WHERE user_id = user_uuid;
        
        RETURN QUERY SELECT 
            false as success,
            'Article is already saved' as message,
            current_count_val,
            (current_count_val >= limit_val) as limit_reached;
        RETURN;
    END IF;
    
    -- Get current count
    SELECT COUNT(*) INTO current_count_val
    FROM saved_articles 
    WHERE user_id = user_uuid;
    
    -- Check if user has reached limit
    IF current_count_val >= limit_val THEN
        RETURN QUERY SELECT 
            false as success,
            'You have reached your saved articles limit (50). Please remove some articles first or upgrade to premium.' as message,
            current_count_val,
            true as limit_reached;
        RETURN;
    END IF;
    
    -- Save the article
    INSERT INTO saved_articles (user_id, article_id)
    VALUES (user_uuid, article_uuid);
    
    -- Return success
    RETURN QUERY SELECT 
        true as success,
        'Article saved successfully' as message,
        (current_count_val + 1),
        ((current_count_val + 1) >= limit_val) as limit_reached;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to remove oldest saved article (for user-initiated cleanup)
CREATE OR REPLACE FUNCTION remove_oldest_saved_article(user_uuid UUID)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    removed_article_title TEXT,
    new_count INTEGER
) AS $$
DECLARE
    oldest_article_id UUID;
    oldest_title TEXT;
    new_count_val INTEGER;
BEGIN
    -- Find the oldest saved article
    SELECT sa.article_id, a.title 
    INTO oldest_article_id, oldest_title
    FROM saved_articles sa
    JOIN articles a ON sa.article_id = a.id
    WHERE sa.user_id = user_uuid
    ORDER BY sa.saved_at ASC
    LIMIT 1;
    
    IF oldest_article_id IS NULL THEN
        RETURN QUERY SELECT 
            false as success,
            'No saved articles found' as message,
            NULL::TEXT as removed_article_title,
            0 as new_count;
        RETURN;
    END IF;
    
    -- Remove the oldest article
    DELETE FROM saved_articles 
    WHERE user_id = user_uuid AND article_id = oldest_article_id;
    
    -- Get new count
    SELECT COUNT(*) INTO new_count_val
    FROM saved_articles WHERE user_id = user_uuid;
    
    RETURN QUERY SELECT 
        true as success,
        'Oldest saved article removed successfully' as message,
        oldest_title,
        new_count_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION can_user_save_article(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION save_article_with_limit_check(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_oldest_saved_article(UUID) TO authenticated;

-- Add comments
COMMENT ON FUNCTION can_user_save_article(UUID) IS 'Checks if user can save more articles and returns limit info';
COMMENT ON FUNCTION save_article_with_limit_check(UUID, UUID) IS 'Attempts to save article with limit validation and user feedback';
COMMENT ON FUNCTION remove_oldest_saved_article(UUID) IS 'Removes the oldest saved article for a user (user-initiated)';