from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db import get_db_session
from app.models import InvestmentAccount
from app.schemas import (
    InvestmentAccountCreate, 
    InvestmentAccount as InvestmentAccountRead, 
    InvestmentAccountUpdate
)
from app.routers.auth import get_current_user
from app.schemas import User


router = APIRouter()


@router.post("/investment-accounts", response_model=InvestmentAccountRead)
def create_investment_account(
    payload: InvestmentAccountCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new investment account."""
    # Check if family member exists and belongs to the current user
    db_investment = InvestmentAccount(
        user_id=current_user.id,
        family_member_id=payload.family_member_id,
        name=payload.name,
        account_type=payload.account_type,
        institution=payload.institution,
        current_balance=payload.current_balance,
        expected_return_rate=payload.expected_return_rate,
        is_taxable=payload.is_taxable,
        notes=payload.notes,
        contribution_room=payload.contribution_room,
        expected_conversion_year=payload.expected_conversion_year
    )
    db.add(db_investment)
    db.commit()
    db.refresh(db_investment)
    return db_investment


@router.get("/investment-accounts", response_model=List[InvestmentAccountRead])
def list_investment_accounts(
    family_member_id: Optional[int] = None,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get all investment accounts, optionally filtered by family member."""
    query = db.query(InvestmentAccount).filter(InvestmentAccount.user_id == current_user.id)
    
    if family_member_id:
        query = query.filter(InvestmentAccount.family_member_id == family_member_id)
    
    return query.all()


@router.get("/investment-accounts/{investment_id}", response_model=InvestmentAccountRead)
def get_investment_account(
    investment_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific investment account by ID."""
    investment = db.query(InvestmentAccount).filter(
        InvestmentAccount.id == investment_id,
        InvestmentAccount.user_id == current_user.id
    ).first()
    
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment account not found"
        )
    
    return investment


@router.put("/investment-accounts/{investment_id}", response_model=InvestmentAccountRead)
def update_investment_account(
    investment_id: int,
    payload: InvestmentAccountUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Update an investment account."""
    investment = db.query(InvestmentAccount).filter(
        InvestmentAccount.id == investment_id,
        InvestmentAccount.user_id == current_user.id
    ).first()
    
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment account not found"
        )
    
    # Update fields
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(investment, field, value)
    
    db.commit()
    db.refresh(investment)
    return investment


@router.delete("/investment-accounts/{investment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_investment_account(
    investment_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Delete an investment account."""
    investment = db.query(InvestmentAccount).filter(
        InvestmentAccount.id == investment_id,
        InvestmentAccount.user_id == current_user.id
    ).first()
    
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment account not found"
        )
    
    db.delete(investment)
    db.commit()
    return None 