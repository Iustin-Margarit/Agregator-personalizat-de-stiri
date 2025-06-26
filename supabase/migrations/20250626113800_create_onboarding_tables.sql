-- Create the categories table
CREATE TABLE public.categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT categories_pkey PRIMARY KEY (id),
    CONSTRAINT categories_name_key UNIQUE (name)
);

-- Add comments to the categories table
COMMENT ON TABLE public.categories IS 'Stores news categories like ''Technology'', ''Politics''.';

-- Create the user_preferred_categories table
CREATE TABLE public.user_preferred_categories (
    user_id uuid NOT NULL,
    category_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT user_preferred_categories_pkey PRIMARY KEY (user_id, category_id),
    CONSTRAINT user_preferred_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE,
    CONSTRAINT user_preferred_categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add comments to the user_preferred_categories table
COMMENT ON TABLE public.user_preferred_categories IS 'Stores user''s selected categories from onboarding.';

-- Create indexes for the user_preferred_categories table
CREATE INDEX user_preferred_categories_user_id_idx ON public.user_preferred_categories USING btree (user_id);
CREATE INDEX user_preferred_categories_category_id_idx ON public.user_preferred_categories USING btree (category_id);

-- Enable Row Level Security for the user_preferred_categories table
ALTER TABLE public.user_preferred_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for the user_preferred_categories table
CREATE POLICY "Allow users to see their own preferences" ON public.user_preferred_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to insert their own preferences" ON public.user_preferred_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to delete their own preferences" ON public.user_preferred_categories FOR DELETE USING (auth.uid() = user_id);

-- Seed the categories table with initial data
INSERT INTO public.categories (name) VALUES
    ('Technology'),
    ('Business'),
    ('Science'),
    ('Health'),
    ('Sports'),
    ('Entertainment');