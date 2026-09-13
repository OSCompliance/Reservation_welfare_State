# Your Deployment Configuration

**Date Configured:** September 11, 2026  
**Status:** Ready to Deploy ✅

---

## 🎯 Your Port Configuration

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Frontend (Survey)** | 5677 | http://localhost:5677 | Start here - main UI |
| **Backend (API)** | 9200 | http://localhost:9200 | API server |
| **API Docs** | 9200 | http://localhost:9200/docs | Test endpoints |
| **Database** | 5433 | localhost:5433 | PostgreSQL |
| **Redis** | 6380 | localhost:6380 | Cache |

---

## 🚀 Deploy Now (One Command)

```bash
cd /Users/jaseem/Downloads/MUSLIM_WELFARE_AI_SYSTEM
docker-compose up -d
```

That's it! All services start on your configured ports.

---

## ✅ After Deploy (What to Do)

### **1. Wait 10 seconds for services to start**
```bash
sleep 10
```

### **2. Check services are running**
```bash
docker ps

# You should see:
# welfare-postgres  (running)
# welfare-redis     (running)
# welfare-backend   (running)
# welfare-frontend  (running)
```

### **3. Verify backend is healthy**
```bash
curl http://localhost:9200/health

# Expected response:
# {"status":"ok","service":"Muslim Welfare AI System","version":"1.0.0"}
```

### **4. Open the survey**
```bash
# Open in browser:
open http://localhost:5677

# Or manual browser: http://localhost:5677
```

### **5. Test the system**
- Enter Household ID: `HH-TEST-001`
- Enter Enumerator ID: `EN001`
- Select Language: `Tamil` (தமிழ்)
- Click "Start Survey"
- Try a few questions
- Try voice input (click 🎤)

---

## 📊 Quick Reference (Copy-Paste)

```
Frontend URL:     http://localhost:5677
Backend URL:      http://localhost:9200
API Docs:         http://localhost:9200/docs
Health Check:     http://localhost:9200/health
Database:         psql postgresql://welfare:welfare123@localhost:5433/welfare_db
```

---

## 🔍 Verify Everything Works

```bash
# 1. All services running?
docker-compose ps

# 2. Backend responding?
curl http://localhost:9200/health -v

# 3. Frontend loads?
curl http://localhost:5677 | head -20

# 4. Database connected?
psql postgresql://welfare:welfare123@localhost:5433/welfare_db -c "SELECT 1"

# 5. Redis working?
redis-cli -p 6380 ping
```

---

## 📝 Add Your Anthropic API Key

```bash
# Edit .env.local
nano .env.local

# Find this line:
ANTHROPIC_API_KEY=sk-ant-your-api-key-here

# Replace with your actual key from:
# https://console.anthropic.com/account/keys

# Save and restart backend:
docker-compose restart backend
```

---

## 🛑 Stop Everything

```bash
docker-compose down
```

---

## 📋 Useful Commands for Your Ports

| Task | Command |
|------|---------|
| **Start** | `docker-compose up -d` |
| **Stop** | `docker-compose down` |
| **Logs** | `docker-compose logs -f` |
| **Backend logs** | `docker-compose logs -f backend` |
| **Restart backend** | `docker-compose restart backend` |
| **Rebuild** | `docker-compose up -d --build` |
| **Status** | `docker-compose ps` |

---

## 🎯 First Steps Checklist

- [ ] Run `docker-compose up -d`
- [ ] Wait 10 seconds
- [ ] Run `docker-compose ps` (verify all running)
- [ ] Open http://localhost:5677
- [ ] Test the survey
- [ ] Add your Anthropic API key to .env.local
- [ ] Try voice input
- [ ] Try different languages (Tamil, English, Hindi, Urdu, Telugu, Malayalam)

---

## 🆘 Troubleshooting

### Port Already in Use?
```bash
# Find what's using the port
lsof -i :9200  # for backend
lsof -i :5677  # for frontend

# Kill it (if safe)
kill -9 <PID>

# Or change port in .env.local and restart
```

### Backend won't connect to database?
```bash
# Check PostgreSQL is running
docker-compose logs postgres

# Verify DATABASE_URL in .env.local is correct
cat .env.local | grep DATABASE_URL

# Should be: postgresql://welfare:welfare123@localhost:5433/welfare_db
```

### Frontend can't reach backend?
```bash
# Check NEXT_PUBLIC_API_URL in .env.local
cat .env.local | grep NEXT_PUBLIC_API_URL

# Should be: http://localhost:9200

# Restart frontend
docker-compose restart frontend
```

---

## 📞 Support

If something doesn't work:

1. Check logs: `docker-compose logs -f`
2. Verify ports: `docker-compose ps`
3. Test backend: `curl http://localhost:9200/health`
4. Check config: `cat .env.local`

---

## ✨ What You Have Ready

✅ Full multilingual AI survey system  
✅ 6 specialized AI agents  
✅ 6 languages (Tamil, English, Hindi, Urdu, Telugu, Malayalam)  
✅ Voice input & output  
✅ Offline mode  
✅ Production-ready backend  
✅ Beautiful responsive frontend  
✅ PostgreSQL database  
✅ Redis cache  

**All running on your custom ports (9200 & 5677)**

---

## 🚀 Deploy Command (Copy-Paste)

```bash
cd /Users/jaseem/Downloads/MUSLIM_WELFARE_AI_SYSTEM && docker-compose up -d && sleep 10 && echo "✅ Deployed! Open: http://localhost:5677"
```

---

**Configuration saved. Ready to deploy whenever you want!** 🎉

---

**Your URLs:**
- 🎯 Survey: **http://localhost:5677**
- 📚 API Docs: **http://localhost:9200/docs**
- 💚 Health: **http://localhost:9200/health**
