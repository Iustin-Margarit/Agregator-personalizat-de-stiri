-- Add has_completed_onboarding to profiles table
alter table public.profiles
add column has_completed_onboarding boolean not null default false;