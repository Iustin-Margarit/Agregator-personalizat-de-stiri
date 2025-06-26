-- Create the articles table
CREATE TABLE public.articles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    title text NOT NULL,
    summary text,
    url text UNIQUE NOT NULL,
    image_url text,
    published_at timestamptz,
    source text,
    author text,
    category_id uuid REFERENCES public.categories(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT articles_pkey PRIMARY KEY (id)
);

-- Add comments to the articles table
COMMENT ON TABLE public.articles IS 'Stores details of news articles.';

-- Enable Row Level Security for the public.articles table
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Policy for articles table: anonymous and authenticated users can read articles
CREATE POLICY "Enable read access for all users" ON public.articles FOR SELECT USING (true);


-- Create the saved_articles table
CREATE TABLE public.saved_articles (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    saved_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT saved_articles_pkey PRIMARY KEY (user_id, article_id)
);

-- Add comments to the saved_articles table
COMMENT ON TABLE public.saved_articles IS 'Links users to articles they have saved.';

-- Enable Row Level Security for the public.saved_articles table
ALTER TABLE public.saved_articles ENABLE ROW LEVEL SECURITY;

-- Policies for saved_articles table
CREATE POLICY "Allow users to save their own articles" ON public.saved_articles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to view their own saved articles" ON public.saved_articles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to delete their own saved articles" ON public.saved_articles FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster access to saved articles by user
CREATE INDEX saved_articles_user_id_idx ON public.saved_articles (user_id);