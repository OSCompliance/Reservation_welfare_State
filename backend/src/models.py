"""Database models for Muslim Welfare AI System"""
from datetime import datetime
from typing import Optional
from uuid import uuid4
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime,
    ForeignKey, JSON, Text, Index, Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()


class LocationCategory(str, enum.Enum):
    MELAPALAYAM = "Melapalayam"
    NEARBY = "Nearby"
    OTHER = "Other"


class BirthCohort(str, enum.Enum):
    PRE_2007 = "Pre-2007"
    POST_2007 = "Post-2007"


class EmploymentStatus(str, enum.Enum):
    GOVERNMENT = "Government"
    PRIVATE = "Private"
    SELF_EMPLOYED = "Self-employed"
    AGRICULTURE = "Agriculture"
    UNEMPLOYED = "Unemployed"
    STUDENT = "Student"


class EducationLevel(str, enum.Enum):
    ILLITERATE = "Illiterate"
    SCHOOL_INCOMPLETE = "School (incomplete)"
    SCHOOL_10TH = "10th pass"
    SCHOOL_12TH = "12th pass"
    COLLEGE_UG = "College UG"
    COLLEGE_PG = "College PG"
    TECHNICAL = "Technical"


class DocumentType(str, enum.Enum):
    CERTIFICATE = "Certificate"
    JOB_LETTER = "Job Letter"
    SALARY_SLIP = "Salary Slip"
    RATION_CARD = "Ration Card"
    INSURANCE = "Insurance"
    OTHER = "Other"


class ReservationUsage(str, enum.Enum):
    YES = "Yes"
    NO = "No"
    ATTEMPTED = "Attempted"
    UNAWARE = "Unaware"


# ============================================================================
# Household & Members
# ============================================================================

class Household(Base):
    __tablename__ = "households"
    __table_args__ = (
        Index('idx_households_locality', 'locality'),
        Index('idx_households_enumerator', 'enumerator_id'),
        Index('idx_households_date', 'date_surveyed'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    survey_round = Column(Integer, default=1)
    date_surveyed = Column(DateTime, default=datetime.utcnow)
    locality = Column(String(255), nullable=False)
    location_category = Column(SQLEnum(LocationCategory), nullable=False)

    # Respondent info
    respondent_name = Column(String(255), nullable=False)
    respondent_age = Column(Integer)
    respondent_gender = Column(String(20))
    respondent_occupation = Column(String(255))
    respondent_education = Column(String(255))

    # Household details
    household_size = Column(Integer)
    monthly_income = Column(Integer)
    house_type = Column(String(255))

    # Survey details
    language_spoken = Column(String(50), default="ta")  # ta, hi, ur, en, te, ml
    enumerator_id = Column(String(255))
    interview_duration_min = Column(Integer)

    # Consent
    consent_recorded = Column(Boolean, default=False)
    consent_audio_url = Column(String(512))

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

    # Relationships
    members = relationship("Member", back_populates="household", cascade="all, delete-orphan")
    education_history = relationship("EducationHistory", secondary="members", viewonly=True)
    employment_history = relationship("EmploymentHistory", secondary="members", viewonly=True)
    documents = relationship("Document", back_populates="household", cascade="all, delete-orphan")
    reservation_apps = relationship("ReservationApplication", back_populates="household", cascade="all, delete-orphan")
    consent_records = relationship("ConsentRecord", back_populates="household", cascade="all, delete-orphan")


class Member(Base):
    __tablename__ = "members"
    __table_args__ = (
        Index('idx_members_household', 'household_id'),
        Index('idx_members_cohort', 'birth_cohort'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    household_id = Column(UUID(as_uuid=True), ForeignKey('households.id'), nullable=False)

    member_relationship = Column(String(50))
    age = Column(Integer)
    gender = Column(String(20))
    marital_status = Column(String(50))

    education_level = Column(SQLEnum(EducationLevel))
    graduation_year = Column(Integer)
    birth_cohort = Column(SQLEnum(BirthCohort))

    is_first_generation_graduate = Column(Boolean, default=False)
    is_currently_studying = Column(Boolean, default=False)

    employment_status = Column(SQLEnum(EmploymentStatus))
    monthly_income = Column(Integer)
    health_status = Column(String(255))

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    household = relationship("Household", back_populates="members")
    education_history = relationship("EducationHistory", back_populates="member", cascade="all, delete-orphan")
    employment_history = relationship("EmploymentHistory", back_populates="member", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="member", cascade="all, delete-orphan")


# ============================================================================
# Education & Employment
# ============================================================================

class EducationHistory(Base):
    __tablename__ = "education_history"
    __table_args__ = (
        Index('idx_education_member', 'member_id'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    member_id = Column(UUID(as_uuid=True), ForeignKey('members.id'), nullable=False)

    institution_name = Column(String(255))
    level = Column(String(50))  # School, College, Technical
    stream = Column(String(255))  # Engineering, Humanities, etc.
    degree = Column(String(255))

    start_year = Column(Integer)
    end_year = Column(Integer)
    marks_gpa = Column(Float)

    used_3_5_quota = Column(Boolean, default=False)
    school_type = Column(String(50))  # Government, Private, Madrasa

    scholarship_received = Column(Boolean, default=False)
    reason_discontinuation = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    member = relationship("Member", back_populates="education_history")


class EmploymentHistory(Base):
    __tablename__ = "employment_history"
    __table_args__ = (
        Index('idx_employment_member', 'member_id'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    member_id = Column(UUID(as_uuid=True), ForeignKey('members.id'), nullable=False)

    employment_type = Column(SQLEnum(EmploymentStatus))
    job_title = Column(String(255))
    department_organization = Column(String(255))

    start_year = Column(Integer)
    end_year = Column(Integer)
    monthly_salary = Column(Integer)
    benefits = Column(Text)

    exam_used = Column(String(255))  # TNPSC, UPSC, etc.
    exam_score = Column(Integer)
    used_3_5_quota = Column(Boolean, default=False)

    contract_type = Column(String(50))  # Permanent, Contract, Temporary
    years_experience = Column(Integer)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    member = relationship("Member", back_populates="employment_history")


# ============================================================================
# Reservation & Verification
# ============================================================================

class ReservationApplication(Base):
    __tablename__ = "reservation_applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    household_id = Column(UUID(as_uuid=True), ForeignKey('households.id'))
    member_id = Column(UUID(as_uuid=True), ForeignKey('members.id'))

    opportunity_type = Column(String(50))  # Education, Government Job
    institution_department = Column(String(255))
    year_applied = Column(Integer)

    used_3_5_quota = Column(SQLEnum(ReservationUsage))
    reason_not_used = Column(Text)
    success_outcome = Column(String(255))

    attempts = Column(Integer, default=1)
    support_received = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    household = relationship("Household", back_populates="reservation_apps")


class Document(Base):
    __tablename__ = "documents"
    __table_args__ = (
        Index('idx_documents_household', 'household_id'),
        Index('idx_documents_member', 'member_id'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    household_id = Column(UUID(as_uuid=True), ForeignKey('households.id'))
    member_id = Column(UUID(as_uuid=True), ForeignKey('members.id'))

    doc_type = Column(SQLEnum(DocumentType))
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    photo_url = Column(String(512))

    # OCR data
    ocr_extracted_text = Column(Text)
    ocr_confidence = Column(Float)  # 0-100
    evidence_score = Column(Integer, default=0)  # 0-100

    verification_status = Column(String(50), default="Unverified")  # Unverified, Verified, Rejected
    verified_by = Column(String(255))
    verified_at = Column(DateTime)

    deleted_at = Column(DateTime)

    # Relationships
    household = relationship("Household", back_populates="documents")
    member = relationship("Member", back_populates="documents")


# ============================================================================
# Consent & Compliance
# ============================================================================

class ConsentRecord(Base):
    __tablename__ = "consent_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    household_id = Column(UUID(as_uuid=True), ForeignKey('households.id'))

    consent_type = Column(String(50))  # Survey, Document Capture, Audio Recording
    given_at = Column(DateTime, default=datetime.utcnow)
    given_by = Column(String(255))
    consent_text = Column(Text)
    language = Column(String(50))

    audio_proof_url = Column(String(512))
    withdrawal_requested_at = Column(DateTime)

    # Relationships
    household = relationship("Household", back_populates="consent_records")


# ============================================================================
# Agent Execution Logs
# ============================================================================

class AgentExecution(Base):
    __tablename__ = "agent_executions"
    __table_args__ = (
        Index('idx_agent_execution_household', 'household_id'),
        Index('idx_agent_execution_created', 'created_at'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    household_id = Column(UUID(as_uuid=True), ForeignKey('households.id'))

    agent_type = Column(String(50))  # coordinator, household, education, etc.
    agent_name = Column(String(255))

    status = Column(String(50))  # Running, Completed, Failed
    input_prompt = Column(Text)
    output_message = Column(Text)

    tokens_used = Column(Integer)
    execution_time_ms = Column(Integer)

    error_message = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)


# ============================================================================
# Audit Log (Zero Trust)
# ============================================================================

class AuditLog(Base):
    __tablename__ = "audit_log"
    __table_args__ = (
        Index('idx_audit_log_user', 'user_id'),
        Index('idx_audit_log_resource', 'resource_type', 'resource_id'),
        Index('idx_audit_log_created', 'created_at'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(String(255))
    action = Column(String(255))
    resource_type = Column(String(255))
    resource_id = Column(UUID(as_uuid=True))

    old_value = Column(JSONB)
    new_value = Column(JSONB)

    ip_address = Column(String(45))
    user_agent = Column(Text)

    status = Column(String(50))  # Success, Failed
    error_message = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)


# ============================================================================
# Offline Sync Queue
# ============================================================================

class SyncQueue(Base):
    __tablename__ = "sync_queue"
    __table_args__ = (
        Index('idx_sync_queue_status', 'status'),
        Index('idx_sync_queue_created', 'created_at'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    household_id = Column(UUID(as_uuid=True), ForeignKey('households.id'))

    action = Column(String(50))  # Create, Update, Delete
    table_name = Column(String(255))
    payload = Column(JSONB)

    status = Column(String(50))  # Pending, Synced, Failed
    synced_at = Column(DateTime)
    error_message = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================================
# Welfare Schemes (For RAG)
# ============================================================================

class WelfareScheme(Base):
    __tablename__ = "welfare_schemes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    eligibility = Column(Text)
    contact = Column(String(255))
    website = Column(String(512))

    language = Column(String(50), default="en")
    tags = Column(JSONB)  # For search: ['education', 'scholarship', 'women', etc.]

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
