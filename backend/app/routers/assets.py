from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db import get_db_session
from app.models import Asset
from app.schemas import AssetCreate, Asset as AssetRead, AssetUpdate
from app.routers.auth import get_current_user
from app.schemas import User


router = APIRouter()


@router.post("/assets", response_model=AssetRead)
def create_asset(
    payload: AssetCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new asset."""
    db_asset = Asset(
        user_id=current_user.id,
        name=payload.name,
        asset_type=payload.asset_type,
        current_value=payload.current_value,
        purchase_value=payload.purchase_value,
        purchase_date=payload.purchase_date,
        expected_annual_appreciation=payload.expected_annual_appreciation,
        is_primary_residence=payload.is_primary_residence,
        notes=payload.notes
    )
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset


@router.get("/assets", response_model=List[AssetRead])
def list_assets(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get all assets."""
    return db.query(Asset).filter(Asset.user_id == current_user.id).all()


@router.get("/assets/{asset_id}", response_model=AssetRead)
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific asset by ID."""
    asset = db.query(Asset).filter(
        Asset.id == asset_id,
        Asset.user_id == current_user.id
    ).first()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    return asset


@router.put("/assets/{asset_id}", response_model=AssetRead)
def update_asset(
    asset_id: int,
    payload: AssetUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Update an asset."""
    asset = db.query(Asset).filter(
        Asset.id == asset_id,
        Asset.user_id == current_user.id
    ).first()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    # Update fields
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(asset, field, value)
    
    # If setting a new asset as primary residence, unset any other primary residences
    if payload.is_primary_residence:
        primary_residences = db.query(Asset).filter(
            Asset.user_id == current_user.id,
            Asset.is_primary_residence == True,
            Asset.id != asset_id
        ).all()
        for residence in primary_residences:
            residence.is_primary_residence = False
    
    db.commit()
    db.refresh(asset)
    return asset


@router.delete("/assets/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Delete an asset."""
    asset = db.query(Asset).filter(
        Asset.id == asset_id,
        Asset.user_id == current_user.id
    ).first()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    db.delete(asset)
    db.commit()
    return None 