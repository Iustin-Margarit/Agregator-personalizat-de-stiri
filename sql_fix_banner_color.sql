-- Add banner_color column to profiles table
-- Run this in the Supabase SQL Editor

BEGIN;

-- Add the banner_color column if it doesn't exist
DO $$ 
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'banner_color'
        AND table_schema = 'public'
    ) THEN
        -- Add the column with default value
        ALTER TABLE public.profiles 
        ADD COLUMN banner_color TEXT DEFAULT '#3B82F6' NOT NULL;
        
        RAISE NOTICE 'Successfully added banner_color column to profiles table';
    ELSE
        RAISE NOTICE 'banner_color column already exists in profiles table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

COMMIT;
