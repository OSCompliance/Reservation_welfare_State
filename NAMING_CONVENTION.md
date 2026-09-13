# 📋 Muslim Welfare AI System - Naming Convention

## ✅ STANDARDIZED NAMING

All components now use consistent naming: **`muslim-welfare`**

---

## 🔗 Live URLs

### Backend API
```
https://muslim-welfare-api.nazeersoft.workers.dev
```
- Service: Cloudflare Workers
- Name: `muslim-welfare-api`
- Type: Serverless Backend

### Frontend
```
https://muslim-welfare.pages.dev
```
- Service: Cloudflare Pages
- Name: `muslim-welfare`
- Type: Static Frontend

### Database
```
welfare_db_phase2 (Cloudflare D1)
```
- Service: Cloudflare D1
- Name: `welfare_db_phase2`
- Type: SQLite Database

---

## 📁 Project Structure

```
Repository: OSCompliance/Reservation_welfare_State
├── Backend
│   ├── Project: muslim-welfare-api
│   ├── URL: https://muslim-welfare-api.nazeersoft.workers.dev
│   └── Framework: Hono (Node.js)
│
├── Frontend
│   ├── Project: muslim-welfare
│   ├── URL: https://muslim-welfare.pages.dev
│   └── Framework: Next.js 14 (React)
│
└── Database
    ├── Project: welfare_db_phase2
    ├── Service: Cloudflare D1
    └── Type: SQLite
```

---

## 🚀 Deployment Configuration

### GitHub Actions Workflows

**Frontend Auto-Deploy:**
```yaml
File: .github/workflows/deploy-to-pages.yml
Trigger: Push to main (frontend changes)
Deploys to: https://muslim-welfare.pages.dev
```

**Backend Auto-Deploy:**
```yaml
File: .github/workflows/deploy-cloudflare-pages.yml (backup)
Trigger: Manual or push
Deploys to: Cloudflare Workers
```

### Wrangler Configuration

**Backend (Root)**
```toml
# wrangler.toml
name = "muslim-welfare-api"
```

**Frontend (frontend/)**
```toml
# frontend/wrangler.toml
name = "muslim-welfare"
```

---

## 🔑 Environment Variables

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=https://muslim-welfare-api.nazeersoft.workers.dev
NEXT_PUBLIC_APP_NAME=Muslim Welfare AI System
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Backend (via Cloudflare)
```
ANTHROPIC_API_KEY = [secret]
CLOUDFLARE_EMAIL = complianceos@gmail.com
CLOUDFLARE_ACCOUNT_ID = 0ed65db800401ab0194d333fe65a7e98
CLOUDFLARE_API_TOKEN = [secret]
```

---

## ✅ Naming Rules

| Component | Naming Pattern | Example |
|-----------|---|---|
| Backend Project | `{name}-api` | `muslim-welfare-api` |
| Frontend Project | `{name}` | `muslim-welfare` |
| Database | `{app}_db_{phase}` | `welfare_db_phase2` |
| Workers | `{name}-{function}` | `muslim-welfare-survey` |
| Pages | `{name}` | `muslim-welfare` |
| GitHub Repo | `{Name}_welfare_State` | `Reservation_welfare_State` |

---

## 🎯 Consistency Checklist

- ✅ Backend: `muslim-welfare-api`
- ✅ Frontend: `muslim-welfare`
- ✅ Database: `welfare_db_phase2`
- ✅ GitHub: `OSCompliance/Reservation_welfare_State`
- ✅ Documentation: All updated
- ✅ Workflows: All updated
- ✅ Environment vars: All consistent

---

## 📞 Quick References

### Get Backend Health
```bash
curl https://muslim-welfare-api.nazeersoft.workers.dev/health
```

### Get Frontend Status
```bash
curl https://muslim-welfare.pages.dev
```

### View API Docs
```bash
https://github.com/OSCompliance/Reservation_welfare_State
```

---

**Last Updated:** 2026-09-13  
**Status:** ✅ Standardized & Consistent  
**Conflicts:** RESOLVED
