# Phase 2 Deployment Guide - Cloudflare Workers

## 🚀 Deploy Agent System to Cloudflare Workers

**Duration:** 15 minutes  
**Cost:** $0 (free tier)  
**Status:** Ready to deploy

---

## Prerequisites

1. Cloudflare account (free: https://dash.cloudflare.com)
2. Wrangler CLI installed
3. ANTHROPIC_API_KEY (for Claude AI)

---

## Step 1: Install Wrangler CLI

```bash
npm install -g wrangler@latest
```

Verify installation:
```bash
wrangler --version
```

---

## Step 2: Authenticate with Cloudflare

```bash
wrangler login
```

This opens a browser to authenticate. Authorize and return to terminal.

---

## Step 3: Create D1 Database (if not exists)

```bash
cd /Users/jaseem/Downloads/MUSLIM_WELFARE_AI_SYSTEM
wrangler d1 create welfare_db_phase2
```

**Save the database ID** from output:
```
database_id = "xxxxx-xxxxx-xxxxx"
```

---

## Step 4: Update wrangler.toml

Add/update this section:
```toml
[[d1_databases]]
binding = "DB"
database_name = "welfare_db_phase2"
database_id = "YOUR_DATABASE_ID_HERE"

[env.production]
vars = { ANTHROPIC_API_KEY = "sk-ant-your-key-here" }
```

---

## Step 5: Initialize D1 Database Schema

Run Phase 2 schema:
```bash
wrangler d1 execute welfare_db_phase2 --file=schema_phase2.sql --remote
```

Confirm: `yes` when asked

---

## Step 6: Deploy to Cloudflare Workers

```bash
wrangler deploy --env production
```

**Expected output:**
```
✓ Uploaded muslim-welfare-api
✓ Deployed to https://muslim-welfare-api.YOUR_ACCOUNT.workers.dev
```

**Save this URL!** You'll need it for frontend.

---

## Step 7: Test Deployment

### Test Health Check
```bash
curl https://muslim-welfare-api.YOUR_ACCOUNT.workers.dev/health
```

Response:
```json
{"status":"ok","timestamp":"2026-09-13T...","worker":"muslim-welfare-api"}
```

### Test Agent Parse
```bash
curl -X POST https://muslim-welfare-api.YOUR_ACCOUNT.workers.dev/api/agents/parse \
  -H "Content-Type: application/json" \
  -d '{
    "input": "5 family members, Ahmed 45, Fatima 42, 3 children",
    "language": "en"
  }'
```

Response:
```json
{
  "success": true,
  "parsed_data": {
    "total_members": 5,
    "members": [...]
  },
  "confidence": 85,
  "completeness": 80
}
```

### Test Agent Auto-Fill
```bash
curl -X POST https://muslim-welfare-api.YOUR_ACCOUNT.workers.dev/api/agents/auto-fill \
  -H "Content-Type: application/json" \
  -d '{
    "input": "5 members, Muslim family, Tamil Nadu",
    "language": "ta"
  }'
```

---

## Step 8: Update Frontend Environment

Update `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=https://muslim-welfare-api.YOUR_ACCOUNT.workers.dev
```

Then redeploy frontend:
```bash
cd frontend
git add .env.local
git commit -m "feat: Update API URL to Cloudflare Workers"
git push origin main
```

---

## Deployment Checklist

- [ ] Wrangler CLI installed
- [ ] Logged into Cloudflare
- [ ] D1 database created
- [ ] wrangler.toml updated with database ID
- [ ] Database schema initialized
- [ ] Worker deployed to Cloudflare
- [ ] Health check working
- [ ] Agent endpoints responding
- [ ] Frontend env var updated
- [ ] Frontend redeployed

---

## Live System URLs

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | https://reservation-welfare.pages.dev | 🟢 |
| **Backend API** | https://muslim-welfare-api.YOUR_ACCOUNT.workers.dev | 🟢 |
| **Database** | Cloudflare D1 | 🟢 |

---

## Troubleshooting

### "Database not found"
```bash
wrangler d1 list
# Find your database, copy ID, update wrangler.toml
```

### "ANTHROPIC_API_KEY missing"
Set environment variable:
```bash
wrangler secret put ANTHROPIC_API_KEY
# Paste your API key when prompted
```

### "Worker timeout"
Agent processing takes ~3-5 seconds. Increase timeout in src/index.ts:
```typescript
const config = {
  timeout: 60000, // 60 seconds
};
```

---

## Next Steps

1. ✅ Deploy to Cloudflare Workers
2. ✅ Test all endpoints
3. ⏳ Phase 3: Bulk import system
4. ⏳ Phase 4: PDF report generation

---

## Production Checklist

- [ ] Error logging enabled
- [ ] Rate limiting configured (if needed)
- [ ] CORS properly set
- [ ] API authentication (if needed)
- [ ] Monitoring/alerts set up

---

**Ready to deploy?** Run the steps above or let Claude handle it! 🚀

