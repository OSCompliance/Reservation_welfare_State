# ☁️ Cloud Deployment Guide - Vercel + Railway

**Fastest way to go live: 10 minutes, $5-10/month**

This guide will deploy your entire system to the cloud with automatic updates every time you push to GitHub.

---

## 📊 What You're Getting

| Component | Service | Cost | URL |
|-----------|---------|------|-----|
| **Frontend (React/Next.js)** | Vercel | **FREE** | vercel.app |
| **Backend (FastAPI)** | Railway | **$5-10/month** | railway.app |
| **Database (PostgreSQL)** | Railway | **Included** | railway.app |
| **Auto-Deploy** | GitHub Actions | **FREE** | On every push |

**Total: $5-10/month for unlimited traffic**

---

## ⏱️ 10-Minute Quick Start

### **STEP 1: Create Free GitHub Account (2 min)**

1. Go to https://github.com/signup
2. Sign up with email
3. Verify email
4. Done ✅

### **STEP 2: Create Free Vercel Account (1 min)**

1. Go to https://vercel.com/signup
2. Click "Continue with GitHub"
3. Authorize
4. Done ✅

### **STEP 3: Create Free Railway Account (1 min)**

1. Go to https://railway.app
2. Click "Start Building"
3. "Deploy from GitHub"
4. Authorize GitHub
5. Done ✅

### **STEP 4: Deploy Backend (3 min)**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Deploy
cd /Users/jaseem/Downloads/MUSLIM_WELFARE_AI_SYSTEM
railway up

# 4. Get backend URL (Railway dashboard shows it)
# Save this URL - you'll need it for frontend
```

Railway will show: `https://your-api.railway.app`

### **STEP 5: Deploy Frontend (2 min)**

```bash
# 1. Go to Vercel Dashboard
# https://vercel.com/dashboard

# 2. Click "Add New"
# 3. Select "Project"
# 4. "Import Git Repository"
# 5. Authorize & select your GitHub repo
# 6. Select "frontend" directory
# 7. Add Environment Variable:
#    NEXT_PUBLIC_API_URL = https://your-api.railway.app
# 8. Click "Deploy"
```

Vercel will show: `https://your-project.vercel.app`

### **STEP 6: Update Backend Env Vars (1 min)**

```bash
# Go to Railway Dashboard
# https://railway.app/dashboard

# 1. Select your backend project
# 2. Go to "Variables"
# 3. Add:
NEXT_PUBLIC_API_URL=https://your-project.vercel.app
ANTHROPIC_API_KEY=sk-ant-your-key-here
DATABASE_URL=postgresql://...  (Railway creates this)

# 4. Redeploy
```

### **STEP 7: Test (1 min)**

```bash
# Open frontend
open https://your-project.vercel.app

# Test survey
# Enter household ID, start survey
# Should work!
```

---

## 📋 Detailed Step-by-Step

### **STEP 1: Create GitHub Repo (If You Don't Have One)**

**Terminal:**
```bash
cd /Users/jaseem/Downloads/MUSLIM_WELFARE_AI_SYSTEM

# If not already a git repo
git init
git add .
git commit -m "Initial commit: Muslim Welfare AI System"
```

**GitHub Web:**
1. Go to https://github.com/new
2. Name: `muslim-welfare-ai`
3. Description: "Multilingual AI household survey system"
4. Make it **Public** (free tier requirement)
5. Click "Create repository"

**Terminal:**
```bash
# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/muslim-welfare-ai.git
git branch -M main
git push -u origin main
```

### **STEP 2: Deploy Backend to Railway**

**Install Railway CLI:**
```bash
npm install -g @railway/cli
```

**Login:**
```bash
railway login
# Opens browser for authentication
```

**Deploy:**
```bash
cd /Users/jaseem/Downloads/MUSLIM_WELFARE_AI_SYSTEM
railway up
# Follow prompts
```

**Get URL:**
- Go to https://railway.app/dashboard
- Click your project
- Click "Deployments"
- Copy the "Public URL" (looks like `https://muslim-welfare-api-prod.up.railway.app`)

### **STEP 3: Deploy Frontend to Vercel**

**Web Browser:**
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. "Import Git Repository"
4. Find `muslim-welfare-ai` repo
5. Click "Import"
6. In "Root Directory" section:
   - Click "Edit"
   - Change to `frontend`
   - Confirm
7. Click "Environment Variables"
8. Add:
   ```
   NEXT_PUBLIC_API_URL = https://your-railway-backend.up.railway.app
   ```
9. Click "Deploy"

**Wait 2-3 minutes...**

Vercel shows: `https://your-project.vercel.app` ✅

### **STEP 4: Update Backend Environment Variables**

**Railway Dashboard:**

1. Go to https://railway.app/dashboard
2. Click your project
3. Click "Variables"
4. Add new variables:

```
ANTHROPIC_API_KEY = sk-ant-your-actual-key-here
CORS_ORIGINS = https://your-project.vercel.app
ENVIRONMENT = production
```

5. Click "Redeploy" to apply changes

### **STEP 5: Test Everything**

```bash
# Test backend health
curl https://your-api.railway.app/health

# Open frontend
open https://your-project.vercel.app

# Start a survey
# 1. Enter Household ID
# 2. Enter Enumerator ID
# 3. Select Language
# 4. Click "Start Survey"
# 5. Answer questions
```

---

## 🔄 Auto-Deploy (Every Push)

Once set up, just push to GitHub and both services auto-deploy!

```bash
# Make changes
# Add new features
# Commit
git add .
git commit -m "feat: new feature"

# Push
git push origin main

# ✅ Vercel + Railway automatically deploy!
```

---

## 📊 Expected URLs After Deployment

| Service | URL | Example |
|---------|-----|---------|
| Frontend | `https://your-project.vercel.app` | https://muslim-welfare-ai.vercel.app |
| Backend | `https://your-api.railway.app` | https://api.railway.app |
| API Docs | `https://your-api.railway.app/docs` | https://api.railway.app/docs |
| Health | `https://your-api.railway.app/health` | https://api.railway.app/health |

---

## 💰 Costs

| Service | Free Tier | Paid Tier | You Pay |
|---------|-----------|-----------|---------|
| **Vercel (Frontend)** | Unlimited | - | **$0** |
| **Railway (Backend)** | $5/month credit | Pay-as-you-go | **$5-10/month** |
| **Railway Database** | 5GB free | Included | **Included** |
| **GitHub** | Unlimited repos | - | **$0** |
| **Total** | | | **~$5-10/month** |

---

## 🆘 Troubleshooting

### Backend deploy fails
```bash
# Check logs in Railway dashboard
# Make sure Dockerfile exists
# Check backend/Dockerfile

# Try manual deploy
cd backend
railway up
```

### Frontend can't reach backend
```bash
# Check NEXT_PUBLIC_API_URL is correct
# Should be: https://your-railway-backend.up.railway.app
# (NOT http://, must be https://)

# Redeploy frontend after changing env var
```

### Database not connecting
```bash
# Railway creates DATABASE_URL automatically
# Copy it from Railway Variables
# Make sure it's in backend env vars
```

### Cold start (slow response)
- Railway free tier has 30-second cold starts
- After first request, it's fast
- Upgrade if you need consistent speed ($10+/month)

---

## 📱 What's Live After Deploy

✅ **Survey App** - Working multilingual interface  
✅ **6 Languages** - Tamil, English, Hindi, Urdu, Telugu, Malayalam  
✅ **Voice I/O** - Speech input/output  
✅ **Offline Mode** - Works without internet  
✅ **6 AI Agents** - All running  
✅ **Database** - All data saved  
✅ **Auto-Deploy** - Updates on every push  

---

## 🚀 Next Steps After Deploy

1. **Test the survey** at your vercel.app URL
2. **Share the link** with users
3. **Push changes** to GitHub (auto-deploys)
4. **Monitor** in Railway/Vercel dashboards
5. **Scale up** if you get lots of traffic

---

## 📞 Getting Help

| Issue | Where to Check |
|-------|-----------------|
| Backend errors | Railway Dashboard → Logs |
| Frontend errors | Vercel Dashboard → Deployments |
| Database errors | Railway Dashboard → Database |
| Deploy status | GitHub → Actions tab |

---

## ✅ Final Checklist

- [ ] GitHub account created
- [ ] Vercel account created
- [ ] Railway account created
- [ ] Code pushed to GitHub
- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set
- [ ] Both URLs tested
- [ ] Survey works at vercel.app URL
- [ ] API docs work at railway.app/docs

---

**After following these steps, you'll have:**
- ✅ Live survey app
- ✅ Live API
- ✅ Live database
- ✅ Auto-deployment on every push
- ✅ Costs: $5-10/month

**Go live in 10 minutes!** 🚀

---

## Quick Command Reference

```bash
# Deploy backend
railway login
railway up

# Deploy frontend (via Vercel web interface)
# 1. vercel.com/dashboard
# 2. "Add New" → "Project"
# 3. Import your GitHub repo
# 4. Set NEXT_PUBLIC_API_URL env var
# 5. Deploy

# Test after deploy
curl https://your-api.railway.app/health
open https://your-project.vercel.app

# Push updates (auto-deploys)
git push origin main
```

---

**You're ready to launch!** 🎉
