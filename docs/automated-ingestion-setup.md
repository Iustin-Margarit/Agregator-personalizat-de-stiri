# Automated News Ingestion Setup

This document explains how to set up automated news ingestion using GitHub Actions.

## Overview

The news ingestion system automatically fetches new articles from RSS feeds every 2 hours using GitHub Actions. This ensures users always have fresh content available.

## Architecture

```
GitHub Actions (Scheduler)
    ↓ (every 2 hours)
Next.js API Route (/api/trigger-ingestion)
    ↓
Supabase Edge Function (news-ingestion)
    ↓
RSS Feeds → Database
```

## Setup Instructions

### 1. GitHub Repository Secrets

Add the following secrets to your GitHub repository:

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add these repository secrets:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `VERCEL_URL` | Your deployed Vercel URL | `https://your-app.vercel.app` |
| `CRON_SECRET` | Secret token for API authentication | `your-random-secret-token-here` |

### 2. Environment Variables

Add the `CRON_SECRET` to your Vercel environment variables:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `CRON_SECRET` = `your-random-secret-token-here` (same as GitHub secret)

### 3. Verify Setup

The GitHub Action will:
- Run automatically every 2 hours
- Can be triggered manually from the Actions tab
- Logs success/failure with detailed output

## Schedule Details

- **Frequency:** Every 2 hours (at :00 minutes)
- **Cron Expression:** `0 */2 * * *`
- **Timezone:** UTC

## Manual Testing

### Test via GitHub Actions UI:
1. Go to repository → Actions tab
2. Select "News Ingestion Scheduler"
3. Click "Run workflow" → "Run workflow"

### Test via API directly:
```bash
curl -X POST https://your-app.vercel.app/api/trigger-ingestion \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json"
```

## Monitoring

### GitHub Actions Logs:
- Check the Actions tab for ingestion history
- Each run shows detailed logs and status

### Vercel Function Logs:
- Check Vercel dashboard → Functions tab for API route logs

### Supabase Logs:
- Check Supabase dashboard → Edge Functions for ingestion function logs

## Troubleshooting

### Common Issues:

1. **401 Unauthorized**
   - Check that `CRON_SECRET` matches in both GitHub and Vercel

2. **404 Not Found**
   - Verify `VERCEL_URL` is correct and points to deployed app

3. **500 Internal Server Error**
   - Check Vercel function logs for specific error details
   - Verify Supabase credentials are correct

4. **No new articles**
   - Check if RSS feeds are responding
   - Verify ingestion function logs in Supabase

### Manual Debug:
```bash
# Check if ingestion endpoint is accessible
curl https://your-app.vercel.app/api/trigger-ingestion

# Should return 401 Unauthorized (which means endpoint exists)
```

## Production Considerations

### Security:
- Use a strong, random `CRON_SECRET`
- Rotate the secret periodically
- Monitor logs for unauthorized access attempts

### Performance:
- Current schedule (every 2 hours) balances freshness with resource usage
- Can be adjusted by modifying the cron expression
- Consider rate limits of RSS feeds

### Reliability:
- GitHub Actions has 99.9% uptime SLA
- Failed runs will be visible in Actions tab
- Consider adding alerting for persistent failures

## Alternative Scheduling Options

If GitHub Actions doesn't work for your use case:

1. **Vercel Cron Jobs** (Paid plans only)
2. **External Cron Services** (cron-job.org, EasyCron)
3. **Cloud Functions with Schedulers** (AWS Lambda + EventBridge)
4. **Self-hosted Cron Jobs**

## File Structure

```
.github/
  workflows/
    news-ingestion.yml     # GitHub Actions workflow
app/
  api/
    trigger-ingestion/
      route.ts             # Next.js API route
supabase/
  functions/
    news-ingestion/
      index.ts             # Supabase Edge Function
```
