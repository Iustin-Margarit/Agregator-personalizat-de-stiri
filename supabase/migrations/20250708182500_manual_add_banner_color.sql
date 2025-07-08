-- Manual fix: Add banner_color column to profiles table
ALTER TABLE public.profiles ADD COLUMN banner_color TEXT DEFAULT '#3B82F6' NOT NULL;
