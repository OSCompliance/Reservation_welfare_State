# Cloudflare Workers + D1 Deployment Guide

**Muslim Welfare AI System Backend**  
Free tier • SQLite database • Edge computing globally

---

## 📊 Architecture

```
GitHub Pages (Frontend)
    ↓ API calls
Cloudflare Workers (Backend API)
    ↓ queries
Cloudflare D1 (SQLite Database)
```

**Cost: $0/month** ✅

---

## 🚀 Quick Start (10 minutes)

### **Step 1: Install Wrangler CLI**

```bash
npm install -g wrangler
```

### **Step 2: Login to Cloudflare**

```bash
wrangler login
```

This opens a browser to authenticate with your Cloudflare account.

### **Step 3: Create D1 Database**

```bash
wrangler d1 create welfare_db
```

Save the **database ID** from the output. You'll need it in the next step.

### **Step 4: Update wrangler.toml**

Open `wrangler.toml` and replace:
```toml
database_id = "YOUR_DATABASE_ID"
```

With your actual database ID from Step 3.

### **Step 5: Initialize Database Schema**

```bash
wrangler d1 execute welfare_db --file=schema.sql
```

This creates all the tables for the survey system.

### **Step 6: Set Environment Variables**

Create `.env.local` in the root directory:

```env
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

Then in wrangler.toml, add:
```toml
[env.production]
vars = { ANTHROPIC_API_KEY = "sk-ant-your-key" }
```

### **Step 7: Test Locally**

```bash
wrangler dev
```

Open http://localhost:8787/health

Should see:
```json
{ "status": "ok", "timestamp": "2026-09-12T14:00:00Z" }
```

### **Step 8: Deploy to Cloudflare**

```bash
wrangler deploy
```

Your API is now LIVE at:
```
https://muslim-welfare-api.YOUR-ACCOUNT.workers.dev
```

---

## 🔗 Update Frontend

Update `.env.local` in `frontend/`:

```env
NEXT_PUBLIC_API_URL=https://muslim-welfare-api.YOUR-ACCOUNT.workers.dev
```

Then redeploy frontend:
```bash
cd frontend
npm run build
git add .
git commit -m "feat: Connect to Cloudflare Workers API"
git push origin main
```

Frontend will auto-deploy via GitHub Actions!

---

## 📋 API Endpoints

### **Start Survey**
```
POST /api/survey/start
Content-Type: application/json

{
  "householdId": "HH-001",
  "enumeratorId": "EN001",
  "language": "ta"
}

Response:
{
  "sessionId": "session_...",
  "questionNumber": 1,
  "totalQuestions": 20,
  "question": "What is your household name?",
  "inputType": "text",
  "options": [],
  "language": "ta"
}
```

### **Submit Answer**
```
POST /api/survey/answer
Content-Type: application/json

{
  "householdId": "HH-001",
  "sessionId": "session_...",
  "answer": "Smith Family",
  "questionNumber": 1,
  "language": "ta"
}

Response:
{
  "sessionId": "session_...",
  "questionNumber": 2,
  "totalQuestions": 20,
  "question": "How many family members?",
  "inputType": "number",
  "options": [],
  "language": "ta"
}
```

### **Get Household Data**
```
GET /api/household/HH-001

Response:
{
  "household": {
    "id": "HH-001",
    "enumerator_id": "EN001",
    "survey_language": "ta",
    "status": "started",
    ...
  },
  "responses": [
    {
      "question_number": 1,
      "answer_text": "Smith Family",
      ...
    }
  ]
}
```

---

## 📊 Database Schema

**Tables:**
- `households` - Main household records
- `members` - Family members
- `education` - Education details
- `employment` - Employment info
- `reservation_benefits` - Reservation data
- `survey_responses` - All responses
- `sync_queue` - Offline sync queue
- `enumerators` - Field researchers
- `sessions` - Survey sessions

---

## 🔐 Deployment Checklist

- [ ] Wrangler CLI installed
- [ ] Logged into Cloudflare (`wrangler login`)
- [ ] Created D1 database (`wrangler d1 create`)
- [ ] Updated `wrangler.toml` with database ID
- [ ] Initialized schema (`wrangler d1 execute`)
- [ ] Set `ANTHROPIC_API_KEY` in wrangler.toml
- [ ] Tested locally (`wrangler dev`)
- [ ] Deployed to Cloudflare (`wrangler deploy`)
- [ ] Updated frontend `NEXT_PUBLIC_API_URL`
- [ ] Redeployed frontend
- [ ] Tested API from frontend

---

## 🧪 Test the Full Flow

1. **Open survey:** https://OSCompliance.github.io/Reservation_welfare/
2. **Enter household ID:** HH-TEST-001
3. **Enter enumerator ID:** EN001
4. **Select language:** Tamil
5. **Click "Start Survey"**
6. **Answer questions** - should see AI-generated questions in Tamil
7. **Complete survey** - data saved to D1!

---

## 💰 Costs

| Service | Cost | Notes |
|---------|------|-------|
| Cloudflare Workers | FREE | 100k requests/day free tier |
| D1 Database | FREE | SQLite, unlimited storage |
| Total | **$0/month** | ✅ |

---

## 🚀 Next Steps

1. ✅ Deploy to Cloudflare Workers
2. ✅ Update frontend env vars
3. ✅ Test full survey flow
4. ✅ Monitor API in Cloudflare dashboard
5. ✅ Add analytics (Cloudflare Analytics)

---

## 📚 Documentation

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Hono Framework](https://hono.dev/)
- [Claude API](https://docs.anthropic.com/)

---

**Ready to deploy?** 🚀

```bash
npm install
wrangler login
wrangler d1 create welfare_db
# ... update wrangler.toml
wrangler d1 execute welfare_db --file=schema.sql
wrangler deploy
```

**That's it!** Your API is live! 🎉
