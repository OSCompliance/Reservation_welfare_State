"""Agents API - Agentic survey execution"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from uuid import uuid4
import json
import asyncio
import logging

from src.db.database import get_db
from src.models import Household, AgentExecution
from src.schemas import AgentExecuteRequest, AgentResponse
from src.agents.coordinator import CoordinatorAgent

router = APIRouter(prefix="/agents")
logger = logging.getLogger(__name__)

# Language to native name mapping
LANGUAGE_NAMES = {
    "ta": "Tamil (தமிழ்)",
    "hi": "Hindi (हिन्दी)",
    "ur": "Urdu (اردو)",
    "en": "English",
    "te": "Telugu (తెలుగు)",
    "ml": "Malayalam (മലയാളം)",
}

LANGUAGE_CODES = {
    "ta": "ta-IN",
    "hi": "hi-IN",
    "ur": "ur-IN",
    "en": "en-US",
    "te": "te-IN",
    "ml": "ml-IN",
}


# ============================================================================
# Agentic Survey Execution
# ============================================================================

@router.post("/execute")
async def execute_agent_survey(
    request: AgentExecuteRequest,
    db: Session = Depends(get_db)
):
    """Execute multilingual survey using agents

    This endpoint orchestrates the agentic AI survey. It:
    1. Loads the household context
    2. Determines which section to ask
    3. Generates the next question using Claude
    4. Validates the previous answer
    5. Streams the response
    """

    # Verify household exists
    household = db.query(Household).filter(
        Household.id == request.household_id
    ).first()

    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    # Verify language is supported
    if request.language not in LANGUAGE_CODES:
        raise HTTPException(
            status_code=400,
            detail=f"Language '{request.language}' not supported. Supported: {list(LANGUAGE_NAMES.keys())}"
        )

    # Create execution log
    execution_id = uuid4()
    execution_log = AgentExecution(
        id=execution_id,
        household_id=request.household_id,
        agent_type="coordinator",
        agent_name=f"Coordinator (Section {request.section})",
        status="Running",
        input_prompt=json.dumps({
            "section": request.section,
            "language": request.language,
            "previous_answer": request.previous_answer,
        }),
    )
    db.add(execution_log)
    db.commit()

    async def generate():
        try:
            # Initialize coordinator agent
            coordinator = CoordinatorAgent(
                language=request.language,
                db=db
            )

            # Execute agent
            result = await coordinator.ask_next_question(
                household_id=request.household_id,
                current_section=request.section,
                previous_answer=request.previous_answer,
                respondent_context=request.respondent_context or {}
            )

            # Update execution log
            execution_log.output_message = json.dumps(result)
            execution_log.status = "Completed"
            db.add(execution_log)
            db.commit()

            # Stream response
            yield f"data: {json.dumps(result)}\n\n"

        except Exception as e:
            logger.error(f"Agent execution error: {e}", exc_info=True)
            execution_log.status = "Failed"
            execution_log.error_message = str(e)
            db.add(execution_log)
            db.commit()

            error_response = {
                "status": "error",
                "message": str(e),
                "execution_id": str(execution_id)
            }
            yield f"data: {json.dumps(error_response)}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


# ============================================================================
# Agent Status & Logs
# ============================================================================

@router.get("/executions/{household_id}")
async def get_agent_logs(
    household_id: str,
    db: Session = Depends(get_db)
):
    """Get all agent execution logs for a household"""
    logs = db.query(AgentExecution).filter(
        AgentExecution.household_id == household_id
    ).order_by(AgentExecution.created_at.desc()).all()

    return {
        "household_id": household_id,
        "total_executions": len(logs),
        "logs": logs
    }


@router.get("/executions/{household_id}/stats")
async def get_execution_stats(
    household_id: str,
    db: Session = Depends(get_db)
):
    """Get statistics on agent execution"""
    from sqlalchemy import func

    total = db.query(AgentExecution).filter(
        AgentExecution.household_id == household_id
    ).count()

    completed = db.query(AgentExecution).filter(
        AgentExecution.household_id == household_id,
        AgentExecution.status == "Completed"
    ).count()

    failed = db.query(AgentExecution).filter(
        AgentExecution.household_id == household_id,
        AgentExecution.status == "Failed"
    ).count()

    avg_time = db.query(func.avg(AgentExecution.execution_time_ms)).filter(
        AgentExecution.household_id == household_id,
        AgentExecution.status == "Completed"
    ).scalar()

    total_tokens = db.query(func.sum(AgentExecution.tokens_used)).filter(
        AgentExecution.household_id == household_id
    ).scalar() or 0

    return {
        "household_id": household_id,
        "total_executions": total,
        "completed": completed,
        "failed": failed,
        "success_rate": (completed / total * 100) if total > 0 else 0,
        "average_execution_time_ms": avg_time or 0,
        "total_tokens_used": total_tokens,
    }


# ============================================================================
# Supported Languages
# ============================================================================

@router.get("/languages")
async def get_supported_languages():
    """Get list of supported languages"""
    return {
        "supported_languages": [
            {
                "code": code,
                "name": LANGUAGE_NAMES.get(code),
                "native_name": LANGUAGE_NAMES.get(code)
            }
            for code in sorted(LANGUAGE_NAMES.keys())
        ]
    }


# ============================================================================
# Agent Health
# ============================================================================

@router.get("/health")
async def agent_health():
    """Check if agents are ready"""
    try:
        # Check if LLM API is accessible
        from anthropic import Anthropic
        client = Anthropic()

        # Simple test
        response = client.messages.create(
            model="claude-opus-4-1-20250805",
            max_tokens=10,
            messages=[
                {"role": "user", "content": "Hello"}
            ]
        )

        return {
            "status": "ok",
            "service": "Agents",
            "llm_available": True,
            "supported_languages": len(LANGUAGE_NAMES),
            "model": "claude-opus-4-1-20250805"
        }
    except Exception as e:
        logger.error(f"Agent health check failed: {e}")
        return {
            "status": "error",
            "service": "Agents",
            "llm_available": False,
            "error": str(e)
        }
