# Deployment Guide - Custom Ports

**Use this guide to deploy on any available ports without conflicts.**

---

## 🚀 Quick Deploy (Choose Your Ports)

### **Option 1: Recommended (Ports 8001, 3001, 5433)**

```bash
cd /Users/jaseem/Downloads/MUSLIM_WELFARE_AI_SYSTEM

# Set ports in .env.local (already configured)
cat .env.local

# Start all services
docker-compose up -d

# Access:
# Frontend:  http://localhost:3001
# Backend:   http://localhost:8001
# Database:  localhost:5433
```

### **Option 2: Alternative (Ports 8100, 4000, 5434)**

```bash
cd /Users/jaseem/Downloads/MUSLIM_WELFARE_AI_SYSTEM

# Create custom config
cat > .env.local << EOF
BACKEND_PORT=8100
FRONTEND_PORT=4000
DB_PORT=5434
REDIS_PORT=6381
DATABASE_URL=postgresql://welfare:welfare123@localhost:5434/welfare_db
REDIS_URL=redis://localhost:6381/0
NEXT_PUBLIC_API_URL=http://localhost:8100
ANTHROPIC_API_KEY=sk-ant-your-key
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:4000
VOICE_ENABLED=true
OFFLINE_ENABLED=true
EOF

# Start
docker-compose up -d

# Access:
# Frontend:  http://localhost:4000
# Backend:   http://localhost:8100
# Database:  localhost:5434
```

### **Option 3: Custom (Your Preferred Ports)**

```bash
cd /Users/jaseem/Downloads/MUSLIM_WELFARE_AI_SYSTEM

# Create .env.local with YOUR ports
cat > .env.local << EOF
BACKEND_PORT=YOUR_BACKEND_PORT
FRONTEND_PORT=YOUR_FRONTEND_PORT
DB_PORT=YOUR_DB_PORT
REDIS_PORT=YOUR_REDIS_PORT
DATABASE_URL=postgresql://welfare:welfare123@localhost:YOUR_DB_PORT/welfare_db
REDIS_URL=redis://localhost:YOUR_REDIS_PORT/0
NEXT_PUBLIC_API_URL=http://localhost:YOUR_BACKEND_PORT
ANTHROPIC_API_KEY=sk-ant-your-key
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:YOUR_FRONTEND_PORT
VOICE_ENABLED=true
OFFLINE_ENABLED=true
EOF

# Start
docker-compose up -d
```

---

## 📋 Available Port Configurations

| Config | Backend | Frontend | DB | Redis | Access URLs |
|--------|---------|----------|-----|-------|-------------|
| **Default** | 8001 | 3001 | 5433 | 6380 | http://localhost:3001 |
| **Alt 1** | 8100 | 4000 | 5434 | 6381 | http://localhost:4000 |
| **Alt 2** | 9000 | 5173 | 5435 | 6382 | http://localhost:5173 |
| **Custom** | YOUR_CHOICE | YOUR_CHOICE | YOUR_CHOICE | YOUR_CHOICE | Configurable |

---

## ✅ Verify Deployment

### **Check if services are running:**

```bash
# View running containers
docker ps

# Should see:
# - welfare-postgres
# - welfare-redis
# - welfare-backend
# - welfare-frontend
```

### **Check health:**

```bash
# Backend health
curl http://localhost:8001/health
# Expected: {"status": "ok", ...}

# Frontend (should load)
curl http://localhost:3001
# Expected: HTML page

# Database
psql postgresql://welfare:welfare123@localhost:5433/welfare_db -c "SELECT 1"
# Expected: 1 row
```

### **View logs:**

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

---

## 🔧 Manual Setup (If Not Using Docker)

### **Backend (Python)**

```bash
# Terminal 1: Backend
cd backend
python -m venv venv
source venv/bin/activate

# Install
pip install -r requirements.txt

# Start PostgreSQL & Redis manually (or docker run)
docker run -d -p 5433:5432 \
  -e POSTGRES_USER=welfare \
  -e POSTGRES_PASSWORD=welfare123 \
  -e POSTGRES_DB=welfare_db \
  pgvector/pgvector:pg16

docker run -d -p 6380:6379 redis:7-alpine

# Initialize DB
python -c "from src.db.database import init_db; init_db()"

# Start backend on port 8001
PORT=8001 uvicorn src.main:app --reload --port 8001
```

### **Frontend (Node.js)**

```bash
# Terminal 2: Frontend
cd frontend
npm install

# Start on port 3001
PORT=3001 npm run dev
```

---

## 🌐 Access Your Application

### **Recommended Setup (8001 & 3001)**

| Service | URL | Purpose |
|---------|-----|---------|
| **Survey** | http://localhost:3001 | Main UI - start here |
| **API Docs** | http://localhost:8001/docs | Interactive API testing |
| **API Health** | http://localhost:8001/health | Backend status |
| **Database** | localhost:5433 | PostgreSQL connection |

### **Command to Open All**

```bash
# macOS
open http://localhost:3001
open http://localhost:8001/docs

# Linux
xdg-open http://localhost:3001
xdg-open http://localhost:8001/docs

# Windows
start http://localhost:3001
start http://localhost:8001/docs
```

---

## 🛑 Stop & Cleanup

### **Stop services:**

```bash
cd /Users/jaseem/Downloads/MUSLIM_WELFARE_AI_SYSTEM
docker-compose down
```

### **Stop and remove data:**

```bash
docker-compose down -v  # Removes volumes too
```

### **Stop one service:**

```bash
docker-compose stop backend  # Stops just backend
docker-compose start backend  # Restarts it
```

---

## 🔄 Restart Services

### **Restart all:**

```bash
docker-compose restart
```

### **Restart specific service:**

```bash
docker-compose restart backend
docker-compose restart frontend
```

### **Full rebuild:**

```bash
docker-compose down
docker-compose up -d --build
```

---

## 📝 Common Issues & Solutions

### **Port Already in Use**

```bash
# Find what's using the port
lsof -i :8001  # macOS/Linux
netstat -ano | findstr :8001  # Windows

# Kill the process (macOS/Linux)
kill -9 <PID>

# Or use different port in .env.local
BACKEND_PORT=8002
```

### **Connection Refused**

```bash
# Wait a few seconds for services to start
sleep 5

# Check if services are healthy
docker-compose ps

# Check logs
docker-compose logs backend
docker-compose logs frontend
```

### **Database Connection Error**

```bash
# Check PostgreSQL is running
docker-compose logs postgres

# Verify connection string in .env.local
cat .env.local | grep DATABASE_URL

# Test connection
psql postgresql://welfare:welfare123@localhost:5433/welfare_db -c "SELECT 1"
```

### **Frontend Can't Connect to Backend**

```bash
# Make sure NEXT_PUBLIC_API_URL is correct
cat .env.local | grep NEXT_PUBLIC_API_URL

# Should be: http://localhost:BACKEND_PORT

# Frontend needs to be rebuilt if you changed it
docker-compose restart frontend
```

---

## 📊 Monitor Performance

```bash
# Real-time resource usage
docker stats welfare-backend welfare-frontend welfare-postgres

# Check backend performance
curl http://localhost:8001/health -v

# Check frontend load time
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001
```

---

## 🔐 Production Deployment

### **Before Going Live:**

1. **Change passwords:**
   ```bash
   # Update .env.local
   POSTGRES_PASSWORD=change-this-to-strong-password
   ```

2. **Use HTTPS:**
   ```bash
   # Get SSL certificate (Let's Encrypt)
   # Update nginx/reverse proxy config
   ```

3. **Set environment:**
   ```bash
   ENVIRONMENT=production
   ```

4. **Add authentication:**
   - Implement user login
   - Add API key authentication
   - Enable rate limiting

5. **Deploy to cloud:**
   ```bash
   # Option A: Railway
   railway up
   
   # Option B: Render
   render deploy
   
   # Option C: AWS/GCP/Azure (custom)
   docker build -t welfare-api .
   docker push <your-registry>/welfare-api
   ```

---

## 📞 Quick Reference

| Task | Command |
|------|---------|
| **Start** | `docker-compose up -d` |
| **Stop** | `docker-compose down` |
| **View logs** | `docker-compose logs -f` |
| **Restart** | `docker-compose restart` |
| **Rebuild** | `docker-compose up -d --build` |
| **Health check** | `curl http://localhost:8001/health` |
| **Open frontend** | `open http://localhost:3001` |
| **Open API docs** | `open http://localhost:8001/docs` |
| **Check status** | `docker-compose ps` |

---

## 🎯 Next Steps

1. **Choose your ports** (use .env.local template)
2. **Run docker-compose up -d**
3. **Open http://localhost:YOUR_FRONTEND_PORT**
4. **Start a survey**
5. **Test with different languages**

---

## 📱 Test Checklist

After deployment, verify:

- [ ] Frontend loads (http://localhost:3001)
- [ ] API docs open (http://localhost:8001/docs)
- [ ] Backend health check passes
- [ ] Survey starts
- [ ] Can answer questions
- [ ] Data saves to database
- [ ] Voice input works
- [ ] Language switching works
- [ ] Offline mode works
- [ ] Database connects

---

**Deployment Ready!** 🚀

Choose your ports from the config table above and run:
```bash
docker-compose up -d
```

All services will start on your custom ports. Access frontend at `http://localhost:YOUR_FRONTEND_PORT`
