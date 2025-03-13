from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db import get_db_session
from app.models.finance import Asset
from app.models.scenario import Scenario
from app.models.entity_value import EntityValue as EntityValueModel
from app.schemas.finance import AssetCreate, AssetUpdate, AssetRead
from app.schemas.entity_value import EntityValue
from app.routers.auth import get_current_user
from app.schemas import User


router = APIRouter(
    prefix="/assets",
    tags=["assets"],
    dependencies=[Depends(get_current_user)]
)


@router.post("/", response_model=AssetRead)
def create_asset(
    payload: AssetCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new asset."""
    asset = Asset(
        user_id=current_user.id,
        name=payload.name,
        asset_type=payload.asset_type,
        purchase_value=payload.purchase_value,
        purchase_date=payload.purchase_date,
        expected_annual_appreciation=payload.expected_annual_appreciation,
        is_primary_residence=payload.is_primary_residence,
        notes=payload.notes
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@router.get("/", response_model=List[AssetRead])
def get_assets(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get all assets for the current user."""
    assets = db.query(Asset).filter(
        Asset.user_id == current_user.id
    ).all()
    
    # Enrich assets with their latest values from the default scenario
    default_scenario = db.query(Scenario).filter(Scenario.name == "Actual").first()
    if not default_scenario:
        raise HTTPException(status_code=404, detail="Default scenario not found")
    
    for asset in assets:
        latest_value = asset.get_latest_value(db, default_scenario.id)
        if latest_value is not None:
            setattr(asset, "current_value", latest_value)
        else:
            setattr(asset, "current_value", 0.0)
    
    return assets


@router.get("/{asset_id}", response_model=AssetRead)
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific asset."""
    asset = db.query(Asset).filter(
        Asset.id == asset_id,
        Asset.user_id == current_user.id
    ).first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Get the latest value from the default scenario
    default_scenario = db.query(Scenario).filter(Scenario.name == "Actual").first()
    if not default_scenario:
        raise HTTPException(status_code=404, detail="Default scenario not found")
    
    latest_value = asset.get_latest_value(db, default_scenario.id)
    if latest_value is not None:
        setattr(asset, "current_value", latest_value)
    else:
        setattr(asset, "current_value", 0.0)
    
    return asset


@router.put("/{asset_id}", response_model=AssetRead)
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
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Update asset fields
    for field, value in payload.dict(exclude_unset=True).items():
        if hasattr(asset, field):
            setattr(asset, field, value)
    
    db.commit()
    db.refresh(asset)
    
    # Get the latest value from the default scenario
    default_scenario = db.query(Scenario).filter(Scenario.name == "Actual").first()
    if not default_scenario:
        raise HTTPException(status_code=404, detail="Default scenario not found")
    
    latest_value = asset.get_latest_value(db, default_scenario.id)
    if latest_value is not None:
        setattr(asset, "current_value", latest_value)
    else:
        setattr(asset, "current_value", 0.0)
    
    return asset


@router.post("/{asset_id}/value", response_model=EntityValue)
def set_asset_value(
    asset_id: int,
    value: float,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Set a new value for an asset."""
    asset = db.query(Asset).filter(
        Asset.id == asset_id,
        Asset.user_id == current_user.id
    ).first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Get the default scenario
    default_scenario = db.query(Scenario).filter(Scenario.name == "Actual").first()
    if not default_scenario:
        raise HTTPException(status_code=404, detail="Default scenario not found")
    
    # Create new entity value
    entity_value = asset.set_value(db, default_scenario.id, value)
    return entity_value


@router.delete("/{asset_id}")
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
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Delete associated entity values
    db.query(EntityValueModel).filter(
        EntityValueModel.entity_type == "ASSET",
        EntityValueModel.entity_id == asset_id
    ).delete()
    
    # Delete the asset
    db.delete(asset)
    db.commit()
    
    return {"message": "Asset deleted"} 