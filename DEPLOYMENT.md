# 🚀 QUICK DEPLOYMENT REFERENCE

## CRITICAL: Automated News Ingestion Setup

**⚠️ Without this setup, users will see stale news content!**

### 1. Required GitHub Secrets:
```
Repository → Settings → Secrets and variables → Actions
```
- `VERCEL_URL`: `https://your-app.vercel.app`
- `CRON_SECRET`: `your-strong-random-secret-token`

### 2. Required Vercel Environment Variables:
```
Vercel Dashboard → Project → Settings → Environment Variables
```
- `CRON_SECRET`: `your-strong-random-secret-token` (same as GitHub)
- `NEXT_PUBLIC_SUPABASE_URL`: `https://your-project.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `your-production-anon-key`

### 3. Test After Deployment:
```bash
# Manual trigger test
GitHub → Actions → "News Ingestion Scheduler" → Run workflow

# API test
curl -X POST https://your-app.vercel.app/api/trigger-ingestion \
  -H "Authorization: Bearer your-secret-token"
```

### 4. Verify Success:
- ✅ GitHub Actions shows green checkmark
- ✅ Fresh articles appear in production app
- ✅ Automatic runs every 2 hours

### 🆘 If Ingestion Fails:
1. Check GitHub Actions logs for errors
2. Verify all secrets/environment variables are correct
3. Manually trigger workflow as temporary fix
4. See full troubleshooting in `docs/automated-ingestion-setup.md`

---
**Files Ready for Deployment:**
- ✅ `.github/workflows/news-ingestion.yml`
- ✅ `app/api/trigger-ingestion/route.ts`
- ✅ `docs/automated-ingestion-setup.md`
