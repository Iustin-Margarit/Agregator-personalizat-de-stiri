-- First, delete any existing folders or tags that violate the new constraints
DELETE FROM public.saved_folders WHERE LENGTH(name) > 25;
DELETE FROM public.saved_tags WHERE LENGTH(name) > 15;

-- Add check constraint for saved_folders name length
ALTER TABLE public.saved_folders
ADD CONSTRAINT check_folder_name_length
CHECK (length(name) <= 25);

-- Add check constraint for saved_tags name length
ALTER TABLE public.saved_tags
ADD CONSTRAINT check_tag_name_length
CHECK (length(name) <= 15);