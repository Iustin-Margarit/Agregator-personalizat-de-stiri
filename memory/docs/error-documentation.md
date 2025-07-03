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

## 3. Login Credentials Disappear and Login Fails

- **Symptom:** When attempting to log in at `http://localhost:3000/login`, credentials disappear from input fields, and the user is not logged in. Browser console shows 404 errors for Next.js static JavaScript chunks (e.g., `_next/static/chunks/app-pages-internals.js`, `_next/static/chunks/main-app.js`).
- **Date:** 2025-06-27
- **Root Cause:** The Next.js development server was failing to properly build and serve essential JavaScript bundles. This prevented the client-side React application, including the login form's state management and submission logic, from executing correctly. The 404 errors indicated that these critical files were not found by the browser.
- **Solution:** A clean rebuild of the Next.js project was performed:
    1. All active `npm run dev` processes were stopped.
    2. The Next.js build cache and output directory (`.next`) was deleted using `Remove-Item -Recurse -Force .next`.
    3. The `package-lock.json` file was deleted (manually, due to a stuck command).
    4. The `node_modules` directory was deleted using `Remove-Item -Recurse -Force node_modules`.
    5. Project dependencies were reinstalled using `npm install`.
    6. The Next.js development server was restarted using `npm run dev`.
    This process ensured a fresh build and proper serving of all necessary JavaScript assets, resolving the login functionality.

## 4. GitHub Actions Workflow Fails to Access Secrets

- **Symptom:** The "News Ingestion Scheduler" GitHub Actions workflow fails with an error message indicating that secrets (`VERCEL_URL`, `CRON_SECRET`) are not being accessed correctly. The logs show `null` values for the secrets.
- **Date:** 2025-07-03
- **Root Cause:** The version of the `.github/workflows/news-ingestion.yml` file on the GitHub repository was outdated and used an incorrect syntax (`format(...)`) to access secrets. The correct syntax for GitHub Actions is `${{ secrets.SECRET_NAME }}`.
- **Solution:** The local `.github/workflows/news-ingestion.yml` file was updated to use the correct syntax. The user must commit and push this corrected file to the GitHub repository to resolve the issue.