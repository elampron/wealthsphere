from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ScenarioBase(BaseModel):
    """Base schema for scenario data."""
    name: str = Field(..., min_length=1, max_length=100, description="Name of the scenario")
    description: Optional[str] = Field(None, max_length=500, description="Optional description of the scenario")


class ScenarioCreate(ScenarioBase):
    """Schema for creating a new scenario."""
    pass


class ScenarioUpdate(BaseModel):
    """Schema for updating a scenario."""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Name of the scenario")
    description: Optional[str] = Field(None, max_length=500, description="Optional description of the scenario")


class ScenarioInDBBase(ScenarioBase):
    """Base schema for scenario in database."""
    id: int
    created_at: datetime
    user_id: int
    is_default: bool
    
    class Config:
        orm_mode = True


class Scenario(ScenarioInDBBase):
    """Schema for returning a scenario."""
    pass 