-- Add missing UPDATE policy for saved_articles table
-- This allows users to update their own saved articles (for folder assignments, read status, etc.)
CREATE POLICY "Allow users to update their own saved articles" 
ON public.saved_articles 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);