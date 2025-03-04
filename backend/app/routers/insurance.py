from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db import get_db_session
from app.models import InsurancePolicy
from app.schemas import InsurancePolicyCreate, InsurancePolicy as InsurancePolicyRead, InsurancePolicyUpdate
from app.routers.auth import get_current_user
from app.schemas import User


router = APIRouter()


@router.post("/insurance-policies", response_model=InsurancePolicyRead)
def create_insurance_policy(
    payload: InsurancePolicyCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new insurance policy."""
    db_policy = InsurancePolicy(
        user_id=current_user.id,
        family_member_id=payload.family_member_id,
        name=payload.name,
        policy_number=payload.policy_number,
        insurance_type=payload.insurance_type,
        provider=payload.provider,
        coverage_amount=payload.coverage_amount,
        premium_amount=payload.premium_amount,
        premium_payment_frequency=payload.premium_payment_frequency,
        start_date=payload.start_date,
        end_date=payload.end_date,
        is_term=payload.is_term,
        is_taxable_benefit=payload.is_taxable_benefit,
        notes=payload.notes
    )
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)
    return db_policy


@router.get("/insurance-policies", response_model=List[InsurancePolicyRead])
def list_insurance_policies(
    family_member_id: Optional[int] = None,
    insurance_type: Optional[str] = None,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get all insurance policies, optionally filtered by family member and type."""
    query = db.query(InsurancePolicy).filter(InsurancePolicy.user_id == current_user.id)
    
    if family_member_id:
        query = query.filter(InsurancePolicy.family_member_id == family_member_id)
    
    if insurance_type:
        query = query.filter(InsurancePolicy.insurance_type == insurance_type)
    
    return query.all()


@router.get("/insurance-policies/{policy_id}", response_model=InsurancePolicyRead)
def get_insurance_policy(
    policy_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific insurance policy by ID."""
    policy = db.query(InsurancePolicy).filter(
        InsurancePolicy.id == policy_id,
        InsurancePolicy.user_id == current_user.id
    ).first()
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insurance policy not found"
        )
    
    return policy


@router.put("/insurance-policies/{policy_id}", response_model=InsurancePolicyRead)
def update_insurance_policy(
    policy_id: int,
    payload: InsurancePolicyUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Update an insurance policy."""
    policy = db.query(InsurancePolicy).filter(
        InsurancePolicy.id == policy_id,
        InsurancePolicy.user_id == current_user.id
    ).first()
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insurance policy not found"
        )
    
    # Update fields
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(policy, field, value)
    
    db.commit()
    db.refresh(policy)
    return policy


@router.delete("/insurance-policies/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_insurance_policy(
    policy_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Delete an insurance policy."""
    policy = db.query(InsurancePolicy).filter(
        InsurancePolicy.id == policy_id,
        InsurancePolicy.user_id == current_user.id
    ).first()
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insurance policy not found"
        )
    
    db.delete(policy)
    db.commit()
    return None 