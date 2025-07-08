-- Fix: Add banner_color column to profiles table
-- This script will add the missing banner_color column and verify it exists

-- Step 1: Add the banner_color column if it doesn't exist
DO $$ 
BEGIN
    -- Try to add the column
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN banner_color TEXT DEFAULT '#3B82F6' NOT NULL;
        RAISE NOTICE 'Successfully added banner_color column';
    EXCEPTION 
        WHEN duplicate_column THEN 
            RAISE NOTICE 'banner_color column already exists, skipping';
    END;
END $$;

-- Step 2: Verify the column was added by showing table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Show sample data to verify
SELECT id, username, avatar_color, banner_color, role 
FROM public.profiles 
LIMIT 3;
