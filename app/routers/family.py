from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List

from app.db import get_db_session
from app.models.user import User
from app.models.family import FamilyMember
from app.schemas.family import (
    FamilyMember as FamilyMemberSchema,
    FamilyMemberCreate,
    FamilyMemberUpdate,
    FamilyMemberList
)
from app.routers.auth import get_current_user
from app.core.logging_config import get_logger

logger = get_logger("family")

router = APIRouter(prefix="/family", tags=["family"])


@router.post("", response_model=FamilyMemberSchema)
def create_family_member(
    family_member_in: FamilyMemberCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a new family member."""
    # Check if it's marked as primary and other members exist
    if family_member_in.is_primary:
        existing_primary = db.query(FamilyMember).filter(
            FamilyMember.user_id == current_user.id,
            FamilyMember.is_primary == True
        ).first()
        
        if existing_primary:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A primary family member already exists"
            )
    
    # Create new family member
    db_family_member = FamilyMember(
        user_id=current_user.id,
        first_name=family_member_in.first_name,
        last_name=family_member_in.last_name,
        date_of_birth=family_member_in.date_of_birth,
        relationship_type=family_member_in.relationship_type,
        is_primary=family_member_in.is_primary,
        expected_retirement_age=family_member_in.expected_retirement_age,
        expected_death_age=family_member_in.expected_death_age,
    )
    db.add(db_family_member)
    db.commit()
    db.refresh(db_family_member)
    
    logger.info(f"Family member {db_family_member.id} created for user {current_user.id}")
    return db_family_member


@router.get("", response_model=List[FamilyMemberSchema])
def get_family_members(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get all family members for the current user."""
    family_members = db.query(FamilyMember).filter(
        FamilyMember.user_id == current_user.id
    ).all()
    
    return family_members


@router.get("/{family_member_id}", response_model=FamilyMemberSchema)
def get_family_member(
    family_member_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get a specific family member by ID."""
    family_member = db.query(FamilyMember).filter(
        FamilyMember.id == family_member_id,
        FamilyMember.user_id == current_user.id
    ).first()
    
    if not family_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family member not found"
        )
    
    return family_member


@router.put("/{family_member_id}", response_model=FamilyMemberSchema)
def update_family_member(
    family_member_id: int,
    family_member_in: FamilyMemberUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update a family member."""
    family_member = db.query(FamilyMember).filter(
        FamilyMember.id == family_member_id,
        FamilyMember.user_id == current_user.id
    ).first()
    
    if not family_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family member not found"
        )
    
    # Check primary status change
    if family_member_in.is_primary is not None and family_member_in.is_primary and not family_member.is_primary:
        # User is trying to set this member as primary
        existing_primary = db.query(FamilyMember).filter(
            FamilyMember.user_id == current_user.id,
            FamilyMember.is_primary == True,
            FamilyMember.id != family_member_id
        ).first()
        
        if existing_primary:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A primary family member already exists"
            )
    
    # Update fields
    update_data = family_member_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(family_member, field, value)
    
    db.commit()
    db.refresh(family_member)
    
    logger.info(f"Family member {family_member.id} updated for user {current_user.id}")
    return family_member


@router.delete("/{family_member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_family_member(
    family_member_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Delete a family member."""
    family_member = db.query(FamilyMember).filter(
        FamilyMember.id == family_member_id,
        FamilyMember.user_id == current_user.id
    ).first()
    
    if not family_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family member not found"
        )
    
    # TODO: Check if there are any related records (investments, income, etc.)
    # that would prevent deletion
    
    db.delete(family_member)
    db.commit()
    
    logger.info(f"Family member {family_member_id} deleted for user {current_user.id}")
    return None 