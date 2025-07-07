-- Create folders table for organizing saved articles
CREATE TABLE public.saved_folders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    color text DEFAULT '#3B82F6', -- Default blue color
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT saved_folders_pkey PRIMARY KEY (id),
    CONSTRAINT saved_folders_user_name_unique UNIQUE (user_id, name)
);

-- Add comments to the saved_folders table
COMMENT ON TABLE public.saved_folders IS 'User-created folders for organizing saved articles.';

-- Enable Row Level Security for the saved_folders table
ALTER TABLE public.saved_folders ENABLE ROW LEVEL SECURITY;

-- Policies for saved_folders table
CREATE POLICY "Allow users to manage their own folders" ON public.saved_folders FOR ALL USING (auth.uid() = user_id);

-- Create index for faster access to folders by user
CREATE INDEX saved_folders_user_id_idx ON public.saved_folders (user_id);

-- Create tags table for tagging saved articles
CREATE TABLE public.saved_tags (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    color text DEFAULT '#10B981', -- Default green color
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT saved_tags_pkey PRIMARY KEY (id),
    CONSTRAINT saved_tags_user_name_unique UNIQUE (user_id, name)
);

-- Add comments to the saved_tags table
COMMENT ON TABLE public.saved_tags IS 'User-created tags for categorizing saved articles.';

-- Enable Row Level Security for the saved_tags table
ALTER TABLE public.saved_tags ENABLE ROW LEVEL SECURITY;

-- Policies for saved_tags table
CREATE POLICY "Allow users to manage their own tags" ON public.saved_tags FOR ALL USING (auth.uid() = user_id);

-- Create index for faster access to tags by user
CREATE INDEX saved_tags_user_id_idx ON public.saved_tags (user_id);

-- Add folder_id and read status to saved_articles table
ALTER TABLE public.saved_articles 
ADD COLUMN folder_id uuid REFERENCES public.saved_folders(id) ON DELETE SET NULL,
ADD COLUMN is_read boolean NOT NULL DEFAULT false,
ADD COLUMN notes text,
ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

-- Create junction table for article-tag relationships (many-to-many)
CREATE TABLE public.saved_article_tags (
    saved_article_user_id uuid NOT NULL,
    saved_article_article_id uuid NOT NULL,
    tag_id uuid NOT NULL REFERENCES public.saved_tags(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT saved_article_tags_pkey PRIMARY KEY (saved_article_user_id, saved_article_article_id, tag_id),
    CONSTRAINT saved_article_tags_saved_article_fkey 
        FOREIGN KEY (saved_article_user_id, saved_article_article_id) 
        REFERENCES public.saved_articles(user_id, article_id) ON DELETE CASCADE
);

-- Add comments to the saved_article_tags table
COMMENT ON TABLE public.saved_article_tags IS 'Junction table linking saved articles to tags.';

-- Enable Row Level Security for the saved_article_tags table
ALTER TABLE public.saved_article_tags ENABLE ROW LEVEL SECURITY;

-- Policies for saved_article_tags table
CREATE POLICY "Allow users to manage their own article tags" ON public.saved_article_tags 
FOR ALL USING (
    auth.uid() = saved_article_user_id
);

-- Create indexes for better performance
CREATE INDEX saved_article_tags_user_article_idx ON public.saved_article_tags (saved_article_user_id, saved_article_article_id);
CREATE INDEX saved_article_tags_tag_idx ON public.saved_article_tags (tag_id);
CREATE INDEX saved_articles_folder_idx ON public.saved_articles (folder_id);
CREATE INDEX saved_articles_read_status_idx ON public.saved_articles (user_id, is_read);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_saved_folders_updated_at BEFORE UPDATE ON public.saved_folders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_articles_updated_at BEFORE UPDATE ON public.saved_articles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create default "Read Later" folder for all existing users
INSERT INTO public.saved_folders (user_id, name, description, color)
SELECT DISTINCT user_id, 'Read Later', 'Default folder for saved articles', '#3B82F6'
FROM public.saved_articles
ON CONFLICT (user_id, name) DO NOTHING;

-- Create some default tags for existing users
INSERT INTO public.saved_tags (user_id, name, color)
SELECT DISTINCT user_id, 'Important', '#EF4444' -- Red
FROM public.saved_articles
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO public.saved_tags (user_id, name, color)
SELECT DISTINCT user_id, 'To Review', '#F59E0B' -- Amber
FROM public.saved_articles
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO public.saved_tags (user_id, name, color)
SELECT DISTINCT user_id, 'Favorites', '#8B5CF6' -- Purple
FROM public.saved_articles
ON CONFLICT (user_id, name) DO NOTHING;