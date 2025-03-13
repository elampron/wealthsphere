from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.entity_value import EntityValueCreate, EntityValue as EntityValueSchema
from app.services.entity_value import create_entity_value, get_latest_value
from app.api.deps import get_db

router = APIRouter()

@router.post("/", response_model=EntityValueSchema, status_code=status.HTTP_201_CREATED)
def create_entity_value_endpoint(entity_value_in: EntityValueCreate, db: Session = Depends(get_db)):
    entity_value = create_entity_value(
        db=db,
        entity_type=entity_value_in.entity_type,
        entity_id=entity_value_in.entity_id,
        scenario_id=entity_value_in.scenario_id,
        value=entity_value_in.value,
        recorded_at=entity_value_in.recorded_at or datetime.utcnow()
    )
    return entity_value

@router.get("/latest", response_model=EntityValueSchema)
def get_latest_entity_value(entity_type: str, entity_id: int, scenario_id: int, db: Session = Depends(get_db)):
    entity_value = get_latest_value(db, entity_type=entity_type, entity_id=entity_id, scenario_id=scenario_id)
    if not entity_value:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entity value not found")
    return entity_value 