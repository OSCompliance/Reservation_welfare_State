"""Main FastAPI application"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import routers
from src.api import households, agents, documents, analysis, export

# Import database
from src.db.database import init_db

# ============================================================================
# Lifespan Events
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("🚀 Muslim Welfare AI System starting...")
    init_db()
    logger.info("✓ Database initialized")

    yield

    # Shutdown
    logger.info("🛑 Muslim Welfare AI System shutting down...")


# ============================================================================
# Create FastAPI App
# ============================================================================

app = FastAPI(
    title="Muslim Welfare AI System",
    description="Multilingual agentic AI for household welfare data collection",
    version="1.0.0",
    lifespan=lifespan,
)

# ============================================================================
# Middleware
# ============================================================================

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "Muslim Welfare AI System",
        "version": "1.0.0"
    }


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Muslim Welfare AI System API",
        "docs": "/docs",
        "openapi": "/openapi.json"
    }


# ============================================================================
# Include Routers
# ============================================================================

app.include_router(households.router, prefix="/api", tags=["Households"])
app.include_router(agents.router, prefix="/api", tags=["Agents"])
app.include_router(documents.router, prefix="/api", tags=["Documents"])
app.include_router(analysis.router, prefix="/api", tags=["Analysis"])
app.include_router(export.router, prefix="/api", tags=["Export"])

# ============================================================================
# Error Handlers
# ============================================================================

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from src.schemas import ErrorResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """Handle validation errors"""
    return JSONResponse(
        status_code=400,
        content={
            "status": 400,
            "message": "Validation error",
            "error_code": "VALIDATION_ERROR",
            "details": exc.errors()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "status": 500,
            "message": "Internal server error",
            "error_code": "INTERNAL_ERROR"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENVIRONMENT") != "production",
    )
