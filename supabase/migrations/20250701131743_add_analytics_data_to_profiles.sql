-- Add analytics_data column to profiles table for tracking user engagement patterns
ALTER TABLE profiles ADD COLUMN analytics_data JSONB DEFAULT '{}'::JSONB;

-- Add an index on the analytics_data column for better query performance
CREATE INDEX idx_profiles_analytics_data ON profiles USING GIN (analytics_data);

-- Add a comment to document the column purpose
COMMENT ON COLUMN profiles.analytics_data IS 'JSON data storing user engagement analytics including like patterns, preferences, and interaction history for personalization algorithms';
