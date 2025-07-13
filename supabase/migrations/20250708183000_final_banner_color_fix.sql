-- Final fix: Add banner_color column if it doesn't exist
-- This uses a more robust approach
BEGIN;

-- Check if column exists and add it if not
DO $$ 
BEGIN
    -- Try to add the column
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN banner_color TEXT DEFAULT '#3B82F6' NOT NULL;
        RAISE NOTICE 'Added banner_color column successfully';
    EXCEPTION 
        WHEN duplicate_column THEN 
            RAISE NOTICE 'banner_color column already exists, skipping';
    END;
END $$;

COMMIT;
