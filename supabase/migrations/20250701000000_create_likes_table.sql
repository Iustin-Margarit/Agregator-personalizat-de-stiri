-- Create the likes table
CREATE TABLE public.likes (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    liked_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT likes_pkey PRIMARY KEY (user_id, article_id)
);

-- Add comments to the likes table
COMMENT ON TABLE public.likes IS 'Links users to articles they have liked.';

-- Enable Row Level Security for the public.likes table
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Policies for likes table
CREATE POLICY "Allow users to like articles" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to view their own likes" ON public.likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to unlike articles" ON public.likes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Allow read access for like counts" ON public.likes FOR SELECT USING (true);

-- Create index for faster access to likes by user
CREATE INDEX likes_user_id_idx ON public.likes (user_id);

-- Create index for faster access to likes by article (for like counts)
CREATE INDEX likes_article_id_idx ON public.likes (article_id);
