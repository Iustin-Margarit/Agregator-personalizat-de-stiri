# Error Documentation

## 1. "Failed to update your profile" during Onboarding

- **Symptom:** When a user tries to save their preferences on the `/onboarding` page, a red error message appears: "Failed to update your profile. Please try again."
- **Date:** 2025-06-26
- **Root Cause:** The frontend code in `components/custom/onboarding-form.tsx` was attempting to set the `has_completed_onboarding` flag in the `profiles` table. However, this column did not exist in the database schema, causing the Supabase `update` call to fail. The initial database migration for the `profiles` table was missing this column.
- **Solution:**
    1. A new database migration file (`supabase/migrations/20250626130000_add_onboarding_to_profiles.sql`) was created.
    2. This migration added the required `has_completed_onboarding` boolean column to the `public.profiles` table, with a default value of `false`.
    3. The database was reset (`npx supabase db reset`) to apply the new migration.

## 2. Supabase CLI command `db reset` fails with `.env.local` parsing error

- **Symptom:** Running `npx supabase db reset` resulted in the error: `failed to parse environment file: .env.local (unexpected character '\n' in variable name)`.
- **Date:** 2025-06-26
- **Root Cause:** The environment variables in the `.env.local` file, specifically the long Supabase keys, were split across multiple lines. The `.env` file format requires each variable assignment to be on a single line.
- **Solution:** The `.env.local` file was corrected by ensuring that each environment variable and its value were on a single, continuous line.