"""Households API endpoints"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from typing import List

from src.db.database import get_db
from src.models import Household, Member
from src.schemas import (
    HouseholdCreate, HouseholdRead, HouseholdUpdate,
    MemberCreate, MemberRead
)

router = APIRouter(prefix="/households")


# ============================================================================
# Household CRUD
# ============================================================================

@router.post("/", response_model=HouseholdRead, status_code=201)
async def create_household(
    household: HouseholdCreate,
    db: Session = Depends(get_db)
):
    """Create a new household"""
    db_household = Household(
        locality=household.locality,
        location_category=household.location_category,
        respondent_name=household.respondent_name,
        respondent_age=household.respondent_age,
        respondent_gender=household.respondent_gender,
        respondent_occupation=household.respondent_occupation,
        respondent_education=household.respondent_education,
        household_size=household.household_size,
        monthly_income=household.monthly_income,
        language_spoken=household.language_spoken,
        enumerator_id=household.enumerator_id,
        date_surveyed=datetime.utcnow(),
    )

    db.add(db_household)
    db.commit()
    db.refresh(db_household)

    return db_household


@router.get("/{household_id}", response_model=HouseholdRead)
async def get_household(
    household_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a single household with all members"""
    household = db.query(Household).filter(
        Household.id == household_id,
        Household.deleted_at.is_(None)
    ).first()

    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    return household


@router.get("/", response_model=List[HouseholdRead])
async def list_households(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    locality: str = Query(None),
    enumerator_id: str = Query(None),
    db: Session = Depends(get_db)
):
    """List households with optional filtering"""
    query = db.query(Household).filter(Household.deleted_at.is_(None))

    if locality:
        query = query.filter(Household.locality.ilike(f"%{locality}%"))

    if enumerator_id:
        query = query.filter(Household.enumerator_id == enumerator_id)

    households = query.order_by(Household.created_at.desc()).offset(skip).limit(limit).all()

    return households


@router.put("/{household_id}", response_model=HouseholdRead)
async def update_household(
    household_id: UUID,
    household_update: HouseholdUpdate,
    db: Session = Depends(get_db)
):
    """Update household"""
    household = db.query(Household).filter(
        Household.id == household_id,
        Household.deleted_at.is_(None)
    ).first()

    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    update_data = household_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(household, field, value)

    household.updated_at = datetime.utcnow()

    db.add(household)
    db.commit()
    db.refresh(household)

    return household


@router.delete("/{household_id}", status_code=204)
async def delete_household(
    household_id: UUID,
    db: Session = Depends(get_db)
):
    """Soft delete household"""
    household = db.query(Household).filter(
        Household.id == household_id,
        Household.deleted_at.is_(None)
    ).first()

    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    household.deleted_at = datetime.utcnow()

    db.add(household)
    db.commit()


# ============================================================================
# Member Management
# ============================================================================

@router.post("/{household_id}/members", response_model=MemberRead, status_code=201)
async def add_member(
    household_id: UUID,
    member: MemberCreate,
    db: Session = Depends(get_db)
):
    """Add a member to household"""
    household = db.query(Household).filter(
        Household.id == household_id,
        Household.deleted_at.is_(None)
    ).first()

    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    db_member = Member(
        household_id=household_id,
        relationship=member.relationship,
        age=member.age,
        gender=member.gender,
        marital_status=member.marital_status,
        education_level=member.education_level,
        birth_cohort=member.birth_cohort,
        is_first_generation_graduate=member.is_first_generation_graduate,
        employment_status=member.employment_status,
        monthly_income=member.monthly_income,
    )

    db.add(db_member)
    db.commit()
    db.refresh(db_member)

    return db_member


@router.get("/{household_id}/members", response_model=List[MemberRead])
async def list_members(
    household_id: UUID,
    db: Session = Depends(get_db)
):
    """List all members of a household"""
    household = db.query(Household).filter(
        Household.id == household_id,
        Household.deleted_at.is_(None)
    ).first()

    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    members = db.query(Member).filter(
        Member.household_id == household_id
    ).all()

    return members


@router.get("/{household_id}/members/{member_id}", response_model=MemberRead)
async def get_member(
    household_id: UUID,
    member_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific member"""
    member = db.query(Member).filter(
        Member.id == member_id,
        Member.household_id == household_id
    ).first()

    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    return member


# ============================================================================
# Statistics
# ============================================================================

@router.get("/stats/overview")
async def get_overview_stats(
    db: Session = Depends(get_db)
):
    """Get overview statistics"""
    total_households = db.query(Household).filter(
        Household.deleted_at.is_(None)
    ).count()

    total_members = db.query(Member).count()

    completed_surveys = db.query(Household).filter(
        Household.deleted_at.is_(None),
        Household.consent_recorded.is_(True)
    ).count()

    avg_interview_time = db.query(func.avg(Household.interview_duration_min)).filter(
        Household.deleted_at.is_(None),
        Household.interview_duration_min.isnot(None)
    ).scalar()

    return {
        "total_households": total_households,
        "total_members": total_members,
        "completed_surveys": completed_surveys,
        "average_interview_time": avg_interview_time,
        "surveys_in_progress": total_households - completed_surveys,
    }


# Import func for aggregate queries
from sqlalchemy import func
