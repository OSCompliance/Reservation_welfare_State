# Muslim Welfare AI System - Standalone Implementation Guide
## Independent Multilingual Agentic Data Collection App

**Project:** Muslim Welfare & Reservation Impact Study  
**Scope:** Tamil Nadu (primary) → India (scalable)  
**Languages:** Tamil, English, Hindi, Urdu, Telugu, Malayalam  
**Status:** New standalone project (NOT integrated with Kifayah VAT)

---

## 1. Project Setup (Standalone)

### 1.1 Create New Project Directory

```bash
mkdir ~/projects/muslim-welfare-ai-system
cd ~/projects/muslim-welfare-ai-system

# Initialize git
git init
git config user.name "Muslim Welfare Research Team"
git config user.email "welfare.research@example.org"

# Create project structure
mkdir -p frontend backend database docs tests
mkdir -p frontend/src/{components,pages,hooks,lib,styles}
mkdir -p backend/src/{api,agents,services,db,middleware}
mkdir -p database/migrations
```

### 1.2 Tech Stack (Independent)

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14 + React 18 | PWA-first, offline support |
| UI Components | shadcn/ui + Tailwind CSS | Accessible, multilingual-ready |
| Forms | React Hook Form + Zod | Type-safe, lightweight |
| State | Zustand (not Redux) | Simpler than Redux, offline-first |
| Offline | IndexedDB + Service Worker | Zero-dependency, browser-native |
| Backend | FastAPI (Python) or Node.js/Hono | Lightweight, LLM-friendly |
| LLM Orchestration | LangGraph + Claude API | Multi-agent workflows |
| Database | PostgreSQL + pgvector | RAG for welfare schemes |
| Speech | Google Cloud Speech APIs | 6-language support |
| Documents | Tesseract OCR + Document AI | Certificate verification |
| Deployment | Docker + Kubernetes or Railway | Scalable, simple DevOps |

### 1.3 Initialize Frontend (Next.js)

```bash
cd frontend

# Create Next.js app
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --no-eslint \
  --src-dir \
  --import-alias '@/*'

# Install additional packages
npm install zustand zod react-hook-form
npm install @radix-ui/react-dialog @radix-ui/react-select
npm install dexie # Offline database
npm install swr # Data fetching with cache
npm install @google-cloud/speech @google-cloud/text-to-speech

# Create multilingual config
cat > src/lib/languages.ts <<'EOF'
export const LANGUAGES = {
  ta: { name: 'Tamil', nativeName: 'தமிழ்', code: 'ta-IN' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', code: 'hi-IN' },
  ur: { name: 'Urdu', nativeName: 'اردو', code: 'ur-IN' },
  en: { name: 'English', nativeName: 'English', code: 'en-US' },
  te: { name: 'Telugu', nativeName: 'తెలుగు', code: 'te-IN' },
  ml: { name: 'Malayalam', nativeName: 'മലയാളം', code: 'ml-IN' },
};

export type Language = keyof typeof LANGUAGES;
EOF
```

### 1.4 Initialize Backend (FastAPI + Python)

```bash
cd ../backend

# Create Python environment
python3 -m venv venv
source venv/bin/activate

# Create requirements.txt
cat > requirements.txt <<'EOF'
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
pydantic==2.5.0
python-dotenv==1.0.0
langgraph==0.0.15
langchain==0.1.0
anthropic==0.7.0
google-cloud-speech==2.21.0
google-cloud-texttospeech==2.14.1
python-multipart==0.0.6
cors==1.0.1
EOF

pip install -r requirements.txt

# Create basic FastAPI app
cat > src/main.py <<'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

app = FastAPI(title="Muslim Welfare AI System")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
EOF
```

### 1.5 Initialize Database (PostgreSQL)

```bash
cd ../database

# Create initial schema migration
cat > migrations/001_initial_schema.sql <<'EOF'
-- Households table
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_round INT DEFAULT 1,
  date_surveyed TIMESTAMP DEFAULT NOW(),
  locality VARCHAR(255),
  location_category VARCHAR(50),
  respondent_name VARCHAR(255),
  respondent_age INT,
  respondent_gender VARCHAR(20),
  respondent_occupation VARCHAR(255),
  household_size INT,
  monthly_income INT,
  language_spoken VARCHAR(50),
  enumerator_id VARCHAR(255),
  interview_duration_min INT,
  consent_recorded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  relationship VARCHAR(50),
  age INT,
  gender VARCHAR(20),
  education_level VARCHAR(255),
  birth_cohort VARCHAR(20),
  is_first_generation_graduate BOOLEAN DEFAULT FALSE,
  employment_status VARCHAR(50),
  monthly_income INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Education history
CREATE TABLE education_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  institution_name VARCHAR(255),
  level VARCHAR(50),
  degree VARCHAR(255),
  start_year INT,
  end_year INT,
  used_3_5_quota BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_households_locality ON households(locality);
CREATE INDEX idx_households_enumerator ON households(enumerator_id);
CREATE INDEX idx_members_household ON members(household_id);
CREATE INDEX idx_education_member ON education_history(member_id);

-- Enable pgvector for RAG
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE welfare_schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  description TEXT,
  eligibility TEXT,
  contact VARCHAR(255),
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_welfare_schemes_embedding ON welfare_schemes USING ivfflat (embedding vector_cosine_ops);
EOF

# Setup docker-compose for local development
cat > docker-compose.yml <<'EOF'
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: welfare
      POSTGRES_PASSWORD: welfare123
      POSTGRES_DB: welfare_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    command: postgres -c shared_preload_libraries=vector

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
EOF
```

---

## 2. Standalone Architecture

```
Muslim Welfare AI System (Independent)
│
├─ Frontend (Next.js PWA)
│  ├─ Pages: Households, Survey, Verification, Reports, Admin
│  ├─ State: Zustand (household, survey, UI state)
│  ├─ Offline: IndexedDB + Service Worker
│  └─ Multilingual: 6 languages + voice I/O
│
├─ Backend (FastAPI/Python)
│  ├─ API Routes
│  │  ├─ /households (CRUD)
│  │  ├─ /surveys (form definitions, responses)
│  │  ├─ /agents/execute (agentic survey)
│  │  ├─ /documents/ocr (certificate processing)
│  │  ├─ /analysis (pre-2007 vs post-2007)
│  │  └─ /export (CSV, Excel, SPSS)
│  │
│  └─ Agents (LangGraph-based)
│     ├─ Coordinator Agent
│     ├─ Household Agent (Sections A–B)
│     ├─ Education Agent (Sections C–D)
│     ├─ Reservation Agent (Section E)
│     ├─ Employment Agent (Sections F, H)
│     ├─ Verification Agent (Section V)
│     ├─ Quality Agent (validation)
│     └─ Analysis Agent (recommendations)
│
├─ Database (PostgreSQL)
│  ├─ households, members, education_history
│  ├─ employment_history, reservation_applications
│  ├─ documents, welfare_schemes, consent_records
│  └─ agent_logs, sync_queue
│
└─ Deployment (Docker/Kubernetes)
   ├─ Frontend container
   ├─ Backend container
   ├─ PostgreSQL container
   └─ Redis cache
```

---

## 3. Environment Setup

```bash
# Backend .env
cat > backend/.env <<'EOF'
FASTAPI_ENV=development
DATABASE_URL=postgresql://welfare:welfare123@localhost:5432/welfare_db
REDIS_URL=redis://localhost:6379/0
ANTHROPIC_API_KEY=sk-ant-xxxxx
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project
GOOGLE_CLOUD_CREDENTIALS_PATH=/path/to/credentials.json
DEFAULT_LANGUAGE=ta
ALLOWED_LANGUAGES=ta,hi,ur,en,te,ml
EOF

# Frontend .env.local
cat > frontend/.env.local <<'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_VOICE_ENABLED=true
NEXT_PUBLIC_OFFLINE_ENABLED=true
NEXT_PUBLIC_LANGUAGES=ta,hi,ur,en,te,ml
NEXT_PUBLIC_DEFAULT_LANGUAGE=ta
EOF
```

---

## 4. Standalone Backend API Endpoints

### 4.1 Household Management

```python
# backend/src/api/households.py
from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/households", tags=["households"])

@router.post("/")
async def create_household(data: dict, db: Session):
    """Create new household"""
    household = Household(
        id=str(uuid.uuid4()),
        locality=data.get("locality"),
        respondent_name=data.get("respondentName"),
        respondent_age=data.get("respondentAge"),
        language_spoken=data.get("language", "ta"),
        enumerator_id=data.get("enumeratorId"),
        consent_recorded=False,
        created_at=datetime.now()
    )
    db.add(household)
    db.commit()
    return {"householdId": household.id, "status": "created"}

@router.get("/{household_id}")
async def get_household(household_id: str, db: Session):
    """Fetch household with all members"""
    household = db.query(Household).filter(
        Household.id == household_id
    ).first()
    
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")
    
    return {
        "household": household,
        "members": household.members,
        "educationHistory": [m.education_history for m in household.members],
        "employmentHistory": [m.employment_history for m in household.members],
    }

@router.put("/{household_id}")
async def update_household(household_id: str, data: dict, db: Session):
    """Update household after survey"""
    household = db.query(Household).filter(
        Household.id == household_id
    ).first()
    
    if not household:
        raise HTTPException(status_code=404)
    
    for key, value in data.items():
        setattr(household, key, value)
    
    household.updated_at = datetime.now()
    db.commit()
    
    return {"status": "updated"}
```

### 4.2 Agentic Survey Endpoint

```python
# backend/src/api/agents.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from langgraph.graph import StateGraph
from langchain.chat_models import ChatAnthropic
import json

router = APIRouter(prefix="/api/agents", tags=["agents"])

@router.post("/execute")
async def execute_agent_survey(request_data: dict):
    """Execute multilingual survey using agents"""
    
    household_id = request_data.get("householdId")
    language = request_data.get("language", "ta")
    current_section = request_data.get("section", "A")
    previous_answer = request_data.get("previousAnswer", "")
    
    # Initialize LLM
    llm = ChatAnthropic(model="claude-3-5-sonnet")
    
    # Build prompt for agent
    prompt = f"""You are a household survey assistant conducting a welfare impact study.
    
Language: {language} ({LANGUAGE_NAMES[language]})
Section: {current_section}
Household: {household_id}
Previous answer: {previous_answer}

Your task:
1. Ask the NEXT question for Section {current_section}
2. Be conversational, respectful, and clear
3. Return JSON: {{"question": "...", "input_type": "text|voice|select|number|photo", "skip_logic": {{...}}}}

Remember:
- Speak naturally in {language}
- One question at a time
- Validate answers against household data
- Flag inconsistencies for follow-up"""
    
    # Stream response
    async def generate():
        response = llm.invoke([{"role": "user", "content": prompt}])
        
        # Parse response as JSON
        try:
            data = json.loads(response.content)
        except:
            data = {"question": response.content, "input_type": "text"}
        
        # Yield streaming data
        yield f"data: {json.dumps(data)}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")
```

### 4.3 Document Processing (OCR)

```python
# backend/src/api/documents.py
from fastapi import APIRouter, UploadFile, File
from pytesseract import pytesseract
from PIL import Image
import io

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.post("/upload")
async def upload_and_process(
    file: UploadFile = File(...),
    household_id: str = None,
    doc_type: str = None
):
    """Upload document and run OCR"""
    
    # Read image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    
    # Run OCR
    extracted_text = pytesseract.image_to_string(image, lang='tam+hin+urd+eng')
    
    # Extract structured data based on document type
    if doc_type == "Certificate":
        data = extract_certificate_data(extracted_text)
    elif doc_type == "SalarySlip":
        data = extract_salary_data(extracted_text)
    else:
        data = {"raw_text": extracted_text}
    
    # Score confidence
    confidence = assess_ocr_quality(extracted_text)
    
    return {
        "documentId": str(uuid.uuid4()),
        "extracted": data,
        "confidence": confidence,
        "ocrText": extracted_text,
        "status": "verified" if confidence > 0.8 else "needs_review"
    }
```

### 4.4 Analysis Endpoint

```python
# backend/src/api/analysis.py
from fastapi import APIRouter
from sqlalchemy import func
from datetime import datetime

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

@router.get("/comparison")
async def pre_post_2007_comparison(locality: str = None, db: Session = None):
    """Compare pre-2007 vs post-2007 generations"""
    
    # Query members by cohort
    pre_2007 = db.query(Member).filter(
        Member.birth_cohort == "Pre-2007"
    ).all()
    
    post_2007 = db.query(Member).filter(
        Member.birth_cohort == "Post-2007"
    ).all()
    
    # Calculate metrics
    metrics = {
        "pre_2007": {
            "avg_education_years": calculate_avg_education(pre_2007),
            "govt_job_percent": (
                len([m for m in pre_2007 if m.employment_status == "Government"]) / 
                len(pre_2007) * 100 if pre_2007 else 0
            ),
            "avg_income": sum([m.monthly_income or 0 for m in pre_2007]) / len(pre_2007) if pre_2007 else 0,
            "first_gen_grad_percent": (
                len([m for m in pre_2007 if m.is_first_generation_graduate]) / 
                len(pre_2007) * 100 if pre_2007 else 0
            ),
        },
        "post_2007": {
            "avg_education_years": calculate_avg_education(post_2007),
            "govt_job_percent": (
                len([m for m in post_2007 if m.employment_status == "Government"]) / 
                len(post_2007) * 100 if post_2007 else 0
            ),
            "avg_income": sum([m.monthly_income or 0 for m in post_2007]) / len(post_2007) if post_2007 else 0,
            "first_gen_grad_percent": (
                len([m for m in post_2007 if m.is_first_generation_graduate]) / 
                len(post_2007) * 100 if post_2007 else 0
            ),
        }
    }
    
    # Calculate change
    metrics["change"] = {
        k: metrics["post_2007"][k] - metrics["pre_2007"][k]
        for k in metrics["pre_2007"].keys()
    }
    
    return metrics
```

---

## 5. Frontend Survey Component (Standalone)

```typescript
// frontend/src/components/MultilingualSurvey.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAgentSurvey } from '@/hooks/useAgentSurvey';
import { LANGUAGES, Language } from '@/lib/languages';

interface SurveyProps {
  householdId: string;
  initialLanguage?: Language;
}

export function MultilingualSurvey({ householdId, initialLanguage = 'ta' }: SurveyProps) {
  const [language, setLanguage] = useLocalStorage<Language>('surveyLanguage', initialLanguage);
  const [userInput, setUserInput] = useState('');
  const [voiceActive, setVoiceActive] = useState(false);
  
  const { question, isLoading, fetchNextQuestion, submitAnswer } = useAgentSurvey({
    householdId,
    language,
  });

  useEffect(() => {
    fetchNextQuestion();
  }, []);

  const handleVoiceInput = async () => {
    setVoiceActive(true);
    try {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = LANGUAGES[language].code;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
      };
      
      recognition.start();
    } catch (error) {
      console.error('Voice input error:', error);
    } finally {
      setVoiceActive(false);
    }
  };

  const handleSubmit = async () => {
    await submitAnswer(userInput);
    setUserInput('');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      {/* Language selector */}
      <div className="mb-6">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="p-2 border border-gray-300 rounded"
        >
          {Object.entries(LANGUAGES).map(([code, lang]) => (
            <option key={code} value={code}>
              {lang.nativeName}
            </option>
          ))}
        </select>
      </div>

      {/* Question display */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">{question}</h2>
      </div>

      {/* Input options */}
      <div className="space-y-4">
        {/* Text input */}
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Type your answer..."
          className="w-full p-3 border border-gray-300 rounded"
          disabled={isLoading}
        />

        {/* Voice input */}
        <button
          onClick={handleVoiceInput}
          disabled={isLoading || voiceActive}
          className={`w-full p-3 rounded font-semibold ${
            voiceActive
              ? 'bg-red-500 text-white'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          🎤 {voiceActive ? 'Listening...' : 'Speak answer'}
        </button>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || !userInput}
          className="w-full p-3 bg-green-500 text-white rounded font-semibold hover:bg-green-600 disabled:bg-gray-300"
        >
          {isLoading ? 'Loading...' : 'Next question'}
        </button>
      </div>
    </div>
  );
}
```

---

## 6. Deployment (Standalone)

### Docker Compose (Local)

```bash
# Start full stack locally
docker-compose up -d

# Initialize database
docker exec postgres psql -U welfare -d welfare_db -f /migrations/001_initial_schema.sql

# Start frontend
cd frontend && npm run dev

# Start backend (in separate terminal)
cd backend && uvicorn src.main:app --reload
```

### Production Deployment (Railway/Render/Fly.io)

```yaml
# fly.toml or equivalent for your platform
[app]
  name = "muslim-welfare-ai"
  
[[services]]
  protocol = "tcp"
  internal_port = 8000
  
  [services.concurrency]
    hard_limit = 25
    soft_limit = 20

[env]
  FASTAPI_ENV = "production"
  DATABASE_URL = "postgresql://..."
  ANTHROPIC_API_KEY = "sk-ant-..."
```

---

## 7. Development Workflow

```bash
# Clone / setup
git clone <repo>
cd muslim-welfare-ai-system
docker-compose up -d

# Frontend dev
cd frontend
npm install
npm run dev

# Backend dev (separate terminal)
cd backend
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Test survey
open http://localhost:3000
```

---

## 8. Deliverables Roadmap

**Phase 1 (Weeks 1-2):** MVP Frontend + Backend skeleton
- [ ] React PWA scaffold
- [ ] Household CRUD APIs
- [ ] Basic survey flow (Sections A–B)
- [ ] Offline storage setup

**Phase 2 (Weeks 3-4):** Agentic AI Integration
- [ ] LangGraph agent orchestration
- [ ] Multilingual prompts (all 6 languages)
- [ ] Real-time question streaming
- [ ] Voice I/O (speech-to-text)

**Phase 3 (Weeks 5-6):** Full Questionnaire
- [ ] All sections (A–V)
- [ ] Skip logic for pre/post 2007
- [ ] Validation rules

**Phase 4 (Weeks 7-8):** Documents & Verification
- [ ] OCR for certificates
- [ ] Evidence scoring
- [ ] Verification workflow

**Phase 5 (Weeks 9-10):** Analytics & Reports
- [ ] Pre-2007 vs post-2007 dashboard
- [ ] Barrier analysis
- [ ] Policy recommendations

**Phase 6 (Weeks 11-12):** Pilot & Scale
- [ ] Field testing with 20 households
- [ ] Feedback & iteration
- [ ] Scale to 100+ households

---

**Key Point:** This is a completely standalone system. No Kifayah integration, no shared codebase. Clean separation of concerns.

Ready to start coding the standalone app?
