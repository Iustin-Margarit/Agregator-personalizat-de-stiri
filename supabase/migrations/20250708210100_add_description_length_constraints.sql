-- First, truncate any existing folder descriptions that violate the new constraints
UPDATE public.saved_folders
SET description = LEFT(description, 40)
WHERE LENGTH(description) > 40;

-- Add check constraint for saved_folders description length
ALTER TABLE public.saved_folders
ADD CONSTRAINT check_folder_description_length
CHECK (length(description) <= 40);