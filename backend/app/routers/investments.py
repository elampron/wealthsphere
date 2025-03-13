from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db import get_db_session
from app.models import InvestmentAccount
from app.models.scenario import Scenario
from app.models.entity_value import EntityValue as EntityValueModel
from app.schemas import (
    InvestmentAccountCreate, 
    InvestmentAccount as InvestmentAccountRead, 
    InvestmentAccountUpdate,
    EntityValueCreate
)
from app.schemas.entity_value import EntityValue
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
    account = InvestmentAccount(
        user_id=current_user.id,
        name=payload.name,
        account_type=payload.account_type,
        institution=payload.institution,
        expected_return_rate=payload.expected_return_rate,
        is_taxable=payload.is_taxable,
        contribution_room=payload.contribution_room,
        expected_conversion_year=payload.expected_conversion_year,
        notes=payload.notes,
        family_member_id=payload.family_member_id
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.get("/investment-accounts", response_model=List[InvestmentAccountRead])
def get_investment_accounts(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get all investment accounts for the current user."""
    accounts = db.query(InvestmentAccount).filter(
        InvestmentAccount.user_id == current_user.id
    ).all()
    
    # Enrich accounts with their latest values from the default scenario
    default_scenario = db.query(Scenario).filter(Scenario.name == "Actual").first()
    if not default_scenario:
        raise HTTPException(status_code=404, detail="Default scenario not found")
    
    for account in accounts:
        latest_value = account.get_latest_value(db, default_scenario.id)
        if latest_value is not None:
            setattr(account, "current_balance", latest_value)
        else:
            setattr(account, "current_balance", 0.0)
    
    return accounts


@router.get("/investment-accounts/{investment_id}", response_model=InvestmentAccountRead)
def get_investment_account(
    investment_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific investment account."""
    account = db.query(InvestmentAccount).filter(
        InvestmentAccount.id == investment_id,
        InvestmentAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Investment account not found")
    
    # Get the latest value from the default scenario
    default_scenario = db.query(Scenario).filter(Scenario.name == "Actual").first()
    if not default_scenario:
        raise HTTPException(status_code=404, detail="Default scenario not found")
    
    latest_value = account.get_latest_value(db, default_scenario.id)
    if latest_value is not None:
        setattr(account, "current_balance", latest_value)
    else:
        setattr(account, "current_balance", 0.0)
    
    return account


@router.put("/investment-accounts/{investment_id}", response_model=InvestmentAccountRead)
def update_investment_account(
    investment_id: int,
    payload: InvestmentAccountUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Update an investment account."""
    account = db.query(InvestmentAccount).filter(
        InvestmentAccount.id == investment_id,
        InvestmentAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Investment account not found")
    
    # Update account fields
    for field, value in payload.dict(exclude_unset=True).items():
        if hasattr(account, field):
            setattr(account, field, value)
    
    db.commit()
    db.refresh(account)
    
    # Get the latest value from the default scenario
    default_scenario = db.query(Scenario).filter(Scenario.name == "Actual").first()
    if not default_scenario:
        raise HTTPException(status_code=404, detail="Default scenario not found")
    
    latest_value = account.get_latest_value(db, default_scenario.id)
    if latest_value is not None:
        setattr(account, "current_balance", latest_value)
    else:
        setattr(account, "current_balance", 0.0)
    
    return account


@router.post("/investment-accounts/{investment_id}/value", response_model=EntityValue)
def set_account_value(
    investment_id: int,
    value: float,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Set a new value for an investment account."""
    account = db.query(InvestmentAccount).filter(
        InvestmentAccount.id == investment_id,
        InvestmentAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Investment account not found")
    
    # Get the default scenario
    default_scenario = db.query(Scenario).filter(Scenario.name == "Actual").first()
    if not default_scenario:
        raise HTTPException(status_code=404, detail="Default scenario not found")
    
    # Create new entity value
    entity_value = account.set_value(db, default_scenario.id, value)
    return entity_value


@router.delete("/investment-accounts/{investment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_investment_account(
    investment_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Delete an investment account."""
    account = db.query(InvestmentAccount).filter(
        InvestmentAccount.id == investment_id,
        InvestmentAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Investment account not found")
    
    # Delete associated entity values
    db.query(EntityValueModel).filter(
        EntityValueModel.entity_type == "INVESTMENT_ACCOUNT",
        EntityValueModel.entity_id == investment_id
    ).delete()
    
    # Delete the account
    db.delete(account)
    db.commit()
    
    return None 