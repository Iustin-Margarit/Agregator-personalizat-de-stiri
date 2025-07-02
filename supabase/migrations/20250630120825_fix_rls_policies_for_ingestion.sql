-- Fix RLS policies to allow service role (Edge Functions) to access and modify data

-- Allow service role to read and update sources table
CREATE POLICY "Service role can manage sources" ON public.sources FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Allow service role to insert articles
CREATE POLICY "Service role can insert articles" ON public.articles FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Allow service role to read articles for duplicate checking
CREATE POLICY "Service role can read articles" ON public.articles FOR SELECT 
USING (auth.role() = 'service_role');

-- Allow service role to manage article_categories
CREATE POLICY "Service role can manage article_categories" ON public.article_categories FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Also ensure the service role can read categories for the foreign key references
CREATE POLICY "Service role can read categories" ON public.categories FOR SELECT 
USING (auth.role() = 'service_role');

-- Note: These policies are in addition to existing user policies, allowing both users and service role access