from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date


class FamilyMemberBase(BaseModel):
    """Base family member schema with common attributes."""
    first_name: str
    last_name: str
    date_of_birth: date
    relationship_type: str
    is_primary: bool = False
    expected_retirement_age: Optional[int] = None
    expected_death_age: Optional[int] = Field(90, ge=0, le=120)


class FamilyMemberCreate(FamilyMemberBase):
    """Schema for creating a new family member."""
    pass


class FamilyMemberUpdate(BaseModel):
    """Schema for updating family member information."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    relationship_type: Optional[str] = None
    is_primary: Optional[bool] = None
    expected_retirement_age: Optional[int] = None
    expected_death_age: Optional[int] = Field(None, ge=0, le=120)


class FamilyMember(FamilyMemberBase):
    """Schema for family member information returned to clients."""
    id: int
    user_id: int
    
    # Calculated properties
    age: int
    retirement_year: Optional[int] = None
    death_year: int

    class Config:
        from_attributes = True


class FamilyMemberList(BaseModel):
    """Schema for a list of family members."""
    family_members: List[FamilyMember] 