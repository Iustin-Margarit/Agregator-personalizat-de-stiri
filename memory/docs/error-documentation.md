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

## 5. Database Constraint Violation When Adding Tags to Articles - FIXED

- **Symptom:** When clicking tags in the saved articles interface, the console shows error: `duplicate key value violates unique constraint "saved_article_tags_pkey"` and tags cannot be added to articles.
- **Date:** 2025-07-04 (Updated: 2025-07-04)
- **Root Cause:** The issue was caused by attempting to INSERT a tag-article association that already existed in the database. The `saved_article_tags` table has a composite primary key `(saved_article_user_id, saved_article_article_id, tag_id)`, and trying to insert a duplicate combination violates this constraint.
- **Technical Details:**
    1. **Two Tag Functionalities**: There are two different tag interactions in the app:
        - **Sidebar tags** (in `saved-articles-manager.tsx`): For filtering articles by tags
        - **Article card tags** (in `enhanced-article-card.tsx`): For adding/removing tags from individual articles
    2. **Database Schema**: The `saved_article_tags` table uses a composite primary key to prevent duplicate tag-article associations
    3. **INSERT vs UPSERT**: The original code used plain `INSERT` which fails on duplicates, instead of `UPSERT` which handles duplicates gracefully
- **Solution:** Fixed the tag-to-article association logic in `enhanced-article-card.tsx`:
    1. **Changed INSERT to UPSERT**: Modified the `handleTagToggle` function to use `supabase.upsert()` instead of `supabase.insert()`
    2. **Added Conflict Resolution**: Specified the conflict resolution strategy with `onConflict` parameter
    3. **Improved Error Handling**: Added proper toast notifications for success/error states
    4. **Cleaned Up Debug Logs**: Removed extensive console.log statements added during debugging
    This ensures that tag-article associations work correctly without database constraint violations, providing a smooth user experience for organizing saved articles.

## 6. Saved Articles Tag Selection State Lost During Navigation - FIXED

- **Symptom:** After selecting a tag for saved articles and navigating away (clicking the logo to go to feed), then returning to the saved articles page, the tag selection is lost and cannot be clicked again until manual page refresh.
- **Date:** 2025-07-04 (Fixed: 2025-07-04)
- **Root Cause:** The issue was caused by a **race condition** between loading tags from the database and reading URL parameters. The sequence was:
    1. Component mounts and `useEffect` for URL parameters runs immediately
    2. URL parameters are read but `tags` array is still empty (not loaded from database yet)
    3. `useEffect` for loading tags runs and populates the tags array
    4. Tag selection cannot be restored because URL reading happened before tags were available
- **Solution:** Implemented proper loading state management to ensure URL parameters are read AFTER data is loaded:
    1. **Added Loading State Tracking**: Added `isDataLoaded` state to track when database data has been loaded
    2. **Updated Data Loading Function**: Modified `loadFoldersAndTags()` to set `isDataLoaded = true` after completion
    3. **Fixed URL Parameter Initialization**: Modified the `useEffect` to only read URL parameters when `isDataLoaded` is true
    4. **Added Tag Validation**: Only restore tag selections for tags that actually exist in the database
    5. **Race Condition Prevention**: Loading state ensures proper initialization order
    This ensures that filter selections persist across navigation without race conditions, providing a seamless user experience.

## 7. GitHub Actions News Ingestion 504 Gateway Timeout - FIXED

- **Symptom:** The GitHub Actions workflow for automated news ingestion fails with "HTTP Status: 504" and "❌ News ingestion failed with status: 504" error message.
- **Date:** 2025-07-04 (Fixed: 2025-07-04)
- **Root Cause:** The Supabase Edge Function [`news-ingestion/index.ts`](supabase/functions/news-ingestion/index.ts) was processing all active RSS sources sequentially in a single request, causing execution time to exceed serverless function timeout limits (typically 60-300 seconds).
- **Technical Details:**
   1. **Sequential Processing Bottleneck**: The function processed each RSS source one after another, with each source taking 10-60 seconds (network fetch + parsing + database operations)
   2. **Network Timeout Accumulation**: Each RSS feed fetch had a 45-second timeout with up to 3 retries, multiplied by the number of sources
   3. **No Batch Management**: All processing happened in a single function invocation without timeout awareness
   4. **Timeout Calculation**: With 10+ active sources, total execution time could easily exceed 5-10 minutes, far beyond typical serverless limits
- **Solution:** Implemented intelligent batch processing with timeout management:
   1. **Batch Processing**: Modified [`news-ingestion/index.ts`](supabase/functions/news-ingestion/index.ts) to process sources in configurable batches (default: 3 sources per batch)
   2. **Timeout Awareness**: Added 4-minute execution time limit with 1-minute buffer, stopping batch processing when timeout approaches
   3. **Orchestration Layer**: Updated [`app/api/trigger-ingestion/route.ts`](app/api/trigger-ingestion/route.ts) to orchestrate multiple batch calls until all sources are processed
   4. **Improved Monitoring**: Enhanced GitHub Actions workflow with detailed batch processing metrics and error reporting
   5. **Source Prioritization**: Sources are ordered by `last_fetched_at` to prioritize least recently updated sources
- **Key Improvements:**
   - **Reliability**: No more 504 timeouts due to batch size limits
   - **Scalability**: Can handle any number of RSS sources by processing in manageable batches
   - **Monitoring**: Detailed logging shows batch progress, articles processed/inserted, and execution times
   - **Error Resilience**: Individual source failures don't stop the entire ingestion process
   - **Performance**: Optimized database queries and reduced memory usage per batch
- **Configuration**: Batch size can be adjusted via request body parameter `batch_size` (default: 3 sources per batch)