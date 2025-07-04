# Per-User Article Retention System - Deployment Guide

## Overview

This guide explains how to deploy and test the new per-user article retention system that ensures articles are only preserved for users who actually saved them.

## What Changed

### Previous Behavior
- Articles were deleted after 30 days ONLY if NO user had saved them
- If any user saved an article, it remained visible to ALL users forever
- This caused storage bloat and irrelevant old articles in feeds

### New Behavior
- Articles are visible to users based on individual save actions:
  - **Recent articles** (< 30 days): Visible to ALL users
  - **Old articles** (> 30 days): Only visible to users who saved them
- Articles are permanently deleted after 60 days if no user has saved them
- True per-user retention: User1's saves don't affect User2's feed

## Database Changes

### New Migration: `20250704210000_implement_per_user_article_retention.sql`

This migration includes:

1. **Updated cleanup function** (`delete_old_articles()`):
   - Now deletes articles older than 60 days (instead of 30)
   - Provides a safety buffer for truly abandoned articles

2. **New visibility function** (`get_user_visible_articles()`):
   - Returns articles visible to a specific user
   - Handles per-user visibility logic
   - Supports pagination

3. **Performance optimizations**:
   - New database indexes for efficient queries
   - Optimized query patterns

## Frontend Changes

### Updated Components

1. **`app/(main)/feed/page.tsx`**:
   - Now uses `get_user_visible_articles()` RPC function
   - Provides user-specific article visibility

2. **`components/custom/feed-content.tsx`**:
   - Updated pagination to use new database function
   - Maintains existing infinite scroll functionality

3. **`components/custom/virtualized-feed-content.tsx`**:
   - Updated filtering and pagination logic
   - Supports search and date filtering with per-user visibility

## Deployment Steps

### 1. Database Migration

```bash
# Apply the new migration
supabase db push

# Or if using CLI migrations
supabase migration up
```

### 2. Verify Database Functions

Connect to your Supabase database and verify the functions exist:

```sql
-- Check if functions were created
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('delete_old_articles', 'get_user_visible_articles', 'count_user_visible_articles');

-- Test the visibility function (replace with actual user_id and source_ids)
SELECT * FROM get_user_visible_articles(
  'your-user-id-here'::uuid,
  ARRAY['source-id-1', 'source-id-2']::uuid[],
  10,
  0
);
```

### 3. Deploy Frontend Changes

```bash
# Install dependencies (if needed)
npm install

# Build and deploy
npm run build
npm run deploy  # or your deployment command

# For Vercel
vercel --prod
```

## Testing the New System

### Test Scenario 1: Basic Per-User Visibility

1. **Setup**: Create two test users (User1, User2)
2. **Action**: 
   - User1 saves an article that's 35 days old
   - User2 does not save the article
3. **Expected Result**:
   - User1 sees the article in their feed (because they saved it)
   - User2 does NOT see the article in their feed (because it's > 30 days and they didn't save it)

### Test Scenario 2: Recent Articles Visibility

1. **Setup**: Article published 15 days ago
2. **Action**: Neither user saves the article
3. **Expected Result**: Both users see the article (because it's < 30 days)

### Test Scenario 3: Cleanup Behavior

1. **Setup**: Article published 65 days ago with no saves
2. **Expected Result**: Article is permanently deleted from database

### Test Scenario 4: Search and Filtering

1. **Setup**: User has saved old articles with specific keywords
2. **Action**: User searches for those keywords
3. **Expected Result**: User finds their saved articles even if they're > 30 days old

## Monitoring and Maintenance

### Database Monitoring

```sql
-- Check cleanup job status
SELECT * FROM cron.job WHERE jobname = 'daily-article-cleanup';

-- Monitor article counts by age
SELECT 
  CASE 
    WHEN created_at > now() - interval '30 days' THEN 'Recent (< 30 days)'
    WHEN created_at > now() - interval '60 days' THEN 'Old (30-60 days)'
    ELSE 'Very Old (> 60 days)'
  END as age_group,
  COUNT(*) as article_count
FROM articles 
GROUP BY age_group;

-- Check saved articles distribution
SELECT 
  COUNT(DISTINCT user_id) as users_with_saves,
  COUNT(*) as total_saves,
  COUNT(DISTINCT article_id) as unique_saved_articles
FROM saved_articles;
```

### Performance Monitoring

```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename = 'articles'
ORDER BY idx_scan DESC;

-- Monitor function performance
SELECT calls, total_time, mean_time, query
FROM pg_stat_statements 
WHERE query LIKE '%get_user_visible_articles%'
ORDER BY total_time DESC;
```

## Rollback Plan

If issues arise, you can rollback by:

1. **Reverting frontend changes**:
   ```bash
   git revert <commit-hash>
   # Redeploy frontend
   ```

2. **Database rollback** (if necessary):
   ```sql
   -- Temporarily disable the new cleanup logic
   SELECT cron.unschedule('daily-article-cleanup');
   
   -- Revert to old cleanup function
   CREATE OR REPLACE FUNCTION delete_old_articles()
   RETURNS void AS $$
   BEGIN
     DELETE FROM public.articles
     WHERE
       created_at < now() - interval '30 days'
       AND id NOT IN (SELECT article_id FROM public.saved_articles);
   END;
   $$ LANGUAGE plpgsql;
   
   -- Re-enable cleanup
   SELECT cron.schedule('daily-article-cleanup', '0 0 * * *', 'SELECT delete_old_articles()');
   ```

## Support and Troubleshooting

### Common Issues

1. **Articles not showing for users**: Check if `get_user_visible_articles` function has proper permissions
2. **Performance issues**: Monitor database indexes and query performance
3. **Cleanup not working**: Verify cron job is enabled and function has proper permissions

### Debug Queries

```sql
-- Check what articles a specific user should see
SELECT a.id, a.title, a.created_at, 
       CASE WHEN sa.article_id IS NOT NULL THEN 'Saved' ELSE 'Recent' END as visibility_reason
FROM articles a
LEFT JOIN saved_articles sa ON (a.id = sa.article_id AND sa.user_id = 'user-id-here')
WHERE (a.created_at >= now() - interval '30 days' OR sa.article_id IS NOT NULL)
ORDER BY a.created_at DESC;
```

## Conclusion

The new per-user article retention system provides:
- ✅ True per-user article visibility
- ✅ Reduced storage costs
- ✅ Cleaner, more relevant feeds
- ✅ Preserved user saved articles
- ✅ Better performance with optimized queries

Users now have complete control over their article retention through their save actions, while the system automatically manages storage and relevance.