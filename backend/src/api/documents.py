"""Documents API - OCR and verification"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4
import logging

from src.db.database import get_db
from src.models import Document
from src.schemas import DocumentRead

router = APIRouter(prefix="/documents")
logger = logging.getLogger(__name__)


@router.post("/upload", response_model=DocumentRead, status_code=201)
async def upload_document(
    household_id: str,
    member_id: str = None,
    doc_type: str = "Certificate",
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload and process document with OCR

    TODO: Implement OCR with Tesseract + Document AI
    """
    # Placeholder - will implement OCR later
    return {
        "id": str(uuid4()),
        "household_id": household_id,
        "member_id": member_id,
        "doc_type": doc_type,
        "uploaded_at": "2026-09-11T00:00:00",
        "ocr_extracted_text": "TODO: OCR processing",
        "evidence_score": 0,
        "verification_status": "Unverified"
    }


@router.get("/verified/{household_id}")
async def get_verified_documents(
    household_id: str,
    db: Session = Depends(get_db)
):
    """Get all verified documents for a household"""
    # Placeholder
    return {"household_id": household_id, "documents": []}


@router.post("/verify/{document_id}")
async def verify_document(
    document_id: str,
    verified_by: str,
    db: Session = Depends(get_db)
):
    """Manually verify a document"""
    # Placeholder
    return {"status": "verified", "document_id": document_id}
