from datetime import datetime
from sqlalchemy.orm import Session
from app.models.entity_value import EntityValue


def get_latest_value(db: Session, entity_type: str, entity_id: int, scenario_id: int):
    """Retrieve the most recent value for a given entity based on recorded_at."""
    return db.query(EntityValue).filter(
        EntityValue.entity_type == entity_type,
        EntityValue.entity_id == entity_id,
        EntityValue.scenario_id == scenario_id
    ).order_by(EntityValue.recorded_at.desc()).first()


def create_entity_value(db: Session, entity_type: str, entity_id: int, scenario_id: int, value: float, recorded_at: datetime):
    """Create a new entity value record."""
    entity_value = EntityValue(
        entity_type=entity_type,
        entity_id=entity_id,
        scenario_id=scenario_id,
        recorded_at=recorded_at,
        value=value
    )
    db.add(entity_value)
    db.commit()
    db.refresh(entity_value)
    return entity_value 