from datetime import datetime
from pydantic import Field
from .base import BaseSchema


class EntityValueBase(BaseSchema):
    """Base schema for entity values."""
    entity_type: str
    entity_id: int
    scenario_id: int
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    value: float = Field(..., ge=0.0)


class EntityValueCreate(EntityValueBase):
    """Schema for creating a new entity value."""
    pass


class EntityValueRead(EntityValueBase):
    """Schema for reading an entity value."""
    id: int
    user_id: int

    class Config:
        from_attributes = True


class EntityValue(EntityValueBase):
    """Schema for entity value information returned to clients."""
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True 