"""Pydantic schemas for request/response validation"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from uuid import UUID


# ============================================================================
# Household Schemas
# ============================================================================

class MemberBase(BaseModel):
    relationship: str
    age: int
    gender: str
    marital_status: Optional[str] = None
    education_level: Optional[str] = None
    birth_cohort: Optional[str] = None
    is_first_generation_graduate: bool = False
    employment_status: Optional[str] = None
    monthly_income: Optional[int] = None


class MemberCreate(MemberBase):
    pass


class MemberRead(MemberBase):
    id: UUID
    household_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class HouseholdBase(BaseModel):
    locality: str
    location_category: str
    respondent_name: str
    respondent_age: int
    respondent_gender: str
    respondent_occupation: Optional[str] = None
    respondent_education: Optional[str] = None
    household_size: int
    monthly_income: Optional[int] = None
    language_spoken: str = "ta"
    interview_duration_min: Optional[int] = None


class HouseholdCreate(HouseholdBase):
    enumerator_id: str


class HouseholdUpdate(BaseModel):
    respondent_occupation: Optional[str] = None
    respondent_education: Optional[str] = None
    household_size: Optional[int] = None
    monthly_income: Optional[int] = None
    consent_recorded: Optional[bool] = None


class HouseholdRead(HouseholdBase):
    id: UUID
    survey_round: int
    date_surveyed: datetime
    consent_recorded: bool
    created_at: datetime
    updated_at: datetime
    members: List[MemberRead] = []

    class Config:
        from_attributes = True


# ============================================================================
# Agent Schemas
# ============================================================================

class AgentExecuteRequest(BaseModel):
    household_id: UUID
    member_id: Optional[UUID] = None
    section: str = "A"  # Section A, B, C, etc.
    language: str = "ta"
    previous_answer: Optional[str] = None
    respondent_context: Optional[dict] = None


class AgentResponse(BaseModel):
    execution_id: UUID
    question: str
    input_type: str = "text"  # text, voice, select, number, photo
    options: Optional[List[str]] = None
    skip_logic: Optional[dict] = None
    follow_up: Optional[str] = None
    progress: int = 0  # 0-100%


class AgentExecutionLog(BaseModel):
    id: UUID
    household_id: UUID
    agent_type: str
    agent_name: str
    status: str
    input_prompt: str
    output_message: str
    tokens_used: int
    execution_time_ms: int
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Document Schemas
# ============================================================================

class DocumentCreate(BaseModel):
    household_id: UUID
    member_id: Optional[UUID] = None
    doc_type: str
    photo_url: str


class DocumentRead(BaseModel):
    id: UUID
    household_id: UUID
    member_id: Optional[UUID] = None
    doc_type: str
    uploaded_at: datetime
    ocr_extracted_text: Optional[str] = None
    ocr_confidence: Optional[float] = None
    evidence_score: int
    verification_status: str

    class Config:
        from_attributes = True


# ============================================================================
# Analysis Schemas
# ============================================================================

class ComparisonMetrics(BaseModel):
    avg_education_years: float
    govt_job_percent: float
    avg_income: int
    first_gen_grad_percent: float


class ComparisonAnalysisResponse(BaseModel):
    pre_2007: ComparisonMetrics
    post_2007: ComparisonMetrics
    change: ComparisonMetrics
    message: str


class BarrierAnalysisResponse(BaseModel):
    top_barriers: List[dict]
    affected_households: int
    recommendations: List[str]


class RecommendationResponse(BaseModel):
    title: str
    description: str
    impact: str
    action: str
    timeline: str
    responsible_entity: str


class PolicyRecommendationsResponse(BaseModel):
    summary: str
    recommendations: List[RecommendationResponse]
    generated_at: datetime


# ============================================================================
# Export Schemas
# ============================================================================

class ExportRequest(BaseModel):
    format: str  # csv, excel, spss
    include: List[str] = ["households", "members", "education", "employment"]
    filters: Optional[dict] = None


class ConsentRequest(BaseModel):
    household_id: UUID
    consent_type: str  # Survey, DocumentCapture, AudioRecording
    language: str
    consent_text: str
    given_by: str
    audio_proof_url: Optional[str] = None


# ============================================================================
# Error Response
# ============================================================================

class ErrorResponse(BaseModel):
    status: int
    message: str
    error_code: Optional[str] = None
    details: Optional[dict] = None
