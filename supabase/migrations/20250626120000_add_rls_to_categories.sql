-- Enable Row Level Security for the public.categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to SELECT from the categories table
CREATE POLICY "Enable read access for all users" ON public.categories FOR SELECT USING (true);