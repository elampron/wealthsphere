from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ScenarioBase(BaseModel):
    """Base scenario schema with common attributes."""
    name: str = Field(..., description="Unique name for the scenario")
    description: Optional[str] = Field(None, description="Optional description of the scenario")


class ScenarioCreate(ScenarioBase):
    """Schema for creating a new scenario."""
    pass


class ScenarioUpdate(BaseModel):
    """Schema for updating a scenario."""
    name: Optional[str] = Field(None, description="Unique name for the scenario")
    description: Optional[str] = Field(None, description="Optional description of the scenario")


class ScenarioInDB(ScenarioBase):
    """Schema for scenario information stored in the database."""
    id: int
    created_at: Optional[datetime] = None
    is_default: bool
    is_locked: bool
    user_id: int

    class Config:
        from_attributes = True


class Scenario(ScenarioInDB):
    """Schema for scenario information returned to clients."""
    pass 