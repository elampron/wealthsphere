from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db import get_db_session
from app.models import IncomeSource
from app.schemas import IncomeSourceCreate, IncomeSource as IncomeSourceRead, IncomeSourceUpdate
from app.routers.auth import get_current_user
from app.schemas import User


router = APIRouter()


@router.post("/income-sources", response_model=IncomeSourceRead)
def create_income_source(
    payload: IncomeSourceCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new income source."""
    db_income = IncomeSource(
        user_id=current_user.id,
        family_member_id=payload.family_member_id,
        name=payload.name,
        income_type=payload.income_type,
        amount=payload.amount,
        is_taxable=payload.is_taxable,
        start_year=payload.start_year,
        end_year=payload.end_year,
        expected_growth_rate=payload.expected_growth_rate,
        notes=payload.notes
    )
    db.add(db_income)
    db.commit()
    db.refresh(db_income)
    return db_income


@router.get("/income-sources", response_model=List[IncomeSourceRead])
def list_income_sources(
    family_member_id: Optional[int] = None,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get all income sources, optionally filtered by family member."""
    query = db.query(IncomeSource).filter(IncomeSource.user_id == current_user.id)
    
    if family_member_id:
        query = query.filter(IncomeSource.family_member_id == family_member_id)
    
    return query.all()


@router.get("/income-sources/{income_id}", response_model=IncomeSourceRead)
def get_income_source(
    income_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific income source by ID."""
    income = db.query(IncomeSource).filter(
        IncomeSource.id == income_id,
        IncomeSource.user_id == current_user.id
    ).first()
    
    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income source not found"
        )
    
    return income


@router.put("/income-sources/{income_id}", response_model=IncomeSourceRead)
def update_income_source(
    income_id: int,
    payload: IncomeSourceUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Update an income source."""
    income = db.query(IncomeSource).filter(
        IncomeSource.id == income_id,
        IncomeSource.user_id == current_user.id
    ).first()
    
    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income source not found"
        )
    
    # Update fields
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(income, field, value)
    
    db.commit()
    db.refresh(income)
    return income


@router.delete("/income-sources/{income_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_income_source(
    income_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Delete an income source."""
    income = db.query(IncomeSource).filter(
        IncomeSource.id == income_id,
        IncomeSource.user_id == current_user.id
    ).first()
    
    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income source not found"
        )
    
    db.delete(income)
    db.commit()
    return None 