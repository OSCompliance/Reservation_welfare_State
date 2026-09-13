# Muslim Welfare AI System - Backend

**FastAPI + PostgreSQL + LangGraph**

## Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 14+
- Redis 7+
- Anthropic API key

### Local Setup (Non-Docker)

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start PostgreSQL & Redis
docker run -d -p 5432:5432 \
  -e POSTGRES_USER=welfare \
  -e POSTGRES_PASSWORD=welfare123 \
  -e POSTGRES_DB=welfare_db \
  pgvector/pgvector:pg16

docker run -d -p 6379:6379 redis:7-alpine

# 4. Initialize database
python -c "from src.db.database import init_db; init_db()"

# 5. Start backend
uvicorn src.main:app --reload --port 8000
```

### Using Docker Compose

```bash
# Start everything
docker-compose up -d

# Check logs
docker-compose logs backend -f

# Stop everything
docker-compose down
```

## Project Structure

```
backend/
├── src/
│  ├── main.py                 # FastAPI app
│  ├── models.py               # SQLAlchemy models
│  ├── schemas.py              # Pydantic schemas
│  ├── db/
│  │  └── database.py          # Database config
│  ├── api/
│  │  ├── households.py        # Household CRUD
│  │  ├── agents.py            # Agent execution
│  │  ├── documents.py         # Document OCR
│  │  ├── analysis.py          # Analysis endpoints
│  │  └── export.py            # Export to CSV/Excel
│  ├── agents/
│  │  ├── coordinator.py       # Coordinator agent
│  │  ├── household.py         # Household section agent (TODO)
│  │  ├── education.py         # Education agent (TODO)
│  │  └── ...                  # Other agents
│  ├── services/               # Business logic (TODO)
│  └── middleware/             # Custom middleware (TODO)
├── tests/                     # Unit & integration tests
├── migrations/                # Database migrations
├── requirements.txt
└── Dockerfile
```

## API Endpoints

### Health & Info
- `GET /health` - Health check
- `GET /` - API info

### Households (MVP - Sections A-B)
- `POST /api/households` - Create household
- `GET /api/households` - List households
- `GET /api/households/{id}` - Get household
- `PUT /api/households/{id}` - Update household
- `DELETE /api/households/{id}` - Soft delete

### Members
- `POST /api/households/{household_id}/members` - Add member
- `GET /api/households/{household_id}/members` - List members
- `GET /api/households/{household_id}/members/{member_id}` - Get member

### Agents (Agentic Survey)
- `POST /api/agents/execute` - Execute next question
- `GET /api/agents/languages` - Supported languages
- `GET /api/agents/health` - Agent health check

### Documents (TODO)
- `POST /api/documents/upload` - Upload & OCR
- `GET /api/documents/verified/{household_id}` - Get verified docs

### Analysis (TODO)
- `GET /api/analysis/comparison` - Pre/post 2007 comparison
- `GET /api/analysis/barriers` - Barrier analysis
- `GET /api/analysis/beneficiaries` - Beneficiary counts

### Export (TODO)
- `GET /api/export/households` - Export households
- `POST /api/export/whitepaper` - Generate White Paper

## Database Schema

Tables:
- `households` - Survey households
- `members` - Family members
- `education_history` - Education records
- `employment_history` - Employment records
- `reservation_applications` - 3.5% quota applications
- `documents` - Uploaded documents (with OCR)
- `consent_records` - Consent tracking (DPDP Act)
- `agent_executions` - Agent logs
- `audit_log` - Zero Trust audit trail
- `sync_queue` - Offline sync queue
- `welfare_schemes` - Welfare schemes (for RAG)

## Environment Variables

See `.env.example` for all options.

Critical ones:
```bash
DATABASE_URL=postgresql://welfare:welfare123@localhost:5432/welfare_db
ANTHROPIC_API_KEY=sk-ant-...
ENVIRONMENT=development
```

## Testing

```bash
# Run tests
pytest tests/

# With coverage
pytest tests/ --cov=src

# Watch mode
pytest-watch tests/
```

## Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make changes** (code is auto-reloaded with `--reload`)

3. **Run tests**
   ```bash
   pytest tests/ -v
   ```

4. **Commit**
   ```bash
   git add .
   git commit -m "feat: your feature"
   ```

5. **Push & create PR**

## Future Phases

### Phase 1 (Current)
- ✅ Household CRUD (Sections A-B)
- ✅ Database schema
- ✅ Agentic AI coordinator
- ⏳ Member management
- ⏳ Consent tracking

### Phase 2
- Education & employment agents
- Skip logic for pre/post 2007
- Document OCR & verification
- Voice I/O integration

### Phase 3
- Analytics engine
- Policy recommendation engine
- White Paper generation
- Export to CSV/Excel/SPSS

### Phase 4
- Supervisor tools
- Quality control dashboard
- Offline sync system
- Field pilot monitoring

## Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check database
psql postgresql://welfare:welfare123@localhost:5432/welfare_db -c "SELECT 1;"
```

### LLM API Error
- Verify `ANTHROPIC_API_KEY` in `.env`
- Check API key is valid on Anthropic dashboard

### Port Already in Use
```bash
# Change port in .env or CLI
uvicorn src.main:app --reload --port 8001
```

## Useful Commands

```bash
# Initialize database
python -c "from src.db.database import init_db; init_db()"

# Drop database (careful!)
python -c "from src.db.database import drop_db; drop_db()"

# Run specific test
pytest tests/test_households.py -v

# Format code
black src/

# Lint
flake8 src/
```

## Contributing

Follow the existing code style:
- Use type hints
- Write docstrings
- Keep functions small (<50 lines)
- Use async where appropriate

## Documentation

- `/docs` - Swagger UI (interactive API docs)
- `/openapi.json` - OpenAPI schema

## Support

- **Questions?** Check the main `README.md` in project root
- **Bug report?** Create an issue in git
- **Need help?** Check `/api` route docstrings

---

**Backend is ready for development. Start with Sections A-B (Household roster and member list).** 🚀
