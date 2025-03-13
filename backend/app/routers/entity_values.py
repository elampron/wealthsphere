from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.db.session import get_db
from app.models.entity_value import EntityValue
from app.schemas.entity_value import EntityValueCreate, EntityValueRead
from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/entity-values",
    tags=["entity-values"],
    dependencies=[Depends(get_current_user)]
)

@router.post("/", response_model=EntityValueRead)
def create_entity_value(
    payload: EntityValueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new entity value."""
    if payload.recorded_at is None:
        payload.recorded_at = datetime.utcnow()
    
    entity_value = EntityValue(
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
        scenario_id=payload.scenario_id,
        value=payload.value,
        recorded_at=payload.recorded_at
    )
    db.add(entity_value)
    db.commit()
    db.refresh(entity_value)
    return entity_value

@router.get("/{entity_type}/{entity_id}", response_model=List[EntityValueRead])
def get_entity_values(
    entity_type: str,
    entity_id: int,
    scenario_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all values for a specific entity in a scenario."""
    values = db.query(EntityValue).filter(
        EntityValue.entity_type == entity_type,
        EntityValue.entity_id == entity_id,
        EntityValue.scenario_id == scenario_id
    ).order_by(EntityValue.recorded_at.desc()).all()
    return values

@router.get("/{entity_type}/{entity_id}/latest", response_model=EntityValueRead)
def get_latest_entity_value(
    entity_type: str,
    entity_id: int,
    scenario_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the latest value for a specific entity in a scenario."""
    value = db.query(EntityValue).filter(
        EntityValue.entity_type == entity_type,
        EntityValue.entity_id == entity_id,
        EntityValue.scenario_id == scenario_id
    ).order_by(EntityValue.recorded_at.desc()).first()
    
    if not value:
        raise HTTPException(status_code=404, detail="No value found for this entity in the specified scenario")
    
    return value 