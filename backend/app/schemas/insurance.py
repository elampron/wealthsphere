from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from enum import Enum


class InsuranceTypeEnum(str, Enum):
    """Enum for different insurance types."""
    LIFE = "LIFE"
    DISABILITY = "DISABILITY"
    CRITICAL_ILLNESS = "CRITICAL_ILLNESS"
    LONG_TERM_CARE = "LONG_TERM_CARE"
    HEALTH = "HEALTH"
    HOME = "HOME"
    AUTO = "AUTO"
    OTHER = "OTHER"


class InsurancePolicyBase(BaseModel):
    """Base insurance policy schema with common attributes."""
    name: str
    policy_number: Optional[str] = None
    insurance_type: InsuranceTypeEnum
    provider: Optional[str] = None
    coverage_amount: float = Field(0.0, ge=0.0)
    premium_amount: float = Field(0.0, ge=0.0)
    premium_payment_frequency: Optional[str] = "annual"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_term: bool = True
    is_taxable_benefit: bool = False
    notes: Optional[str] = None


class InsurancePolicyCreate(InsurancePolicyBase):
    """Schema for creating a new insurance policy."""
    family_member_id: int


class InsurancePolicyUpdate(BaseModel):
    """Schema for updating insurance policy information."""
    name: Optional[str] = None
    policy_number: Optional[str] = None
    insurance_type: Optional[InsuranceTypeEnum] = None
    provider: Optional[str] = None
    coverage_amount: Optional[float] = Field(None, ge=0.0)
    premium_amount: Optional[float] = Field(None, ge=0.0)
    premium_payment_frequency: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_term: Optional[bool] = None
    is_taxable_benefit: Optional[bool] = None
    notes: Optional[str] = None
    family_member_id: Optional[int] = None


class InsurancePolicy(InsurancePolicyBase):
    """Schema for insurance policy information returned to clients."""
    id: int
    user_id: int
    family_member_id: int

    class Config:
        from_attributes = True


class InsurancePolicyList(BaseModel):
    """Schema for a list of insurance policies."""
    policies: List[InsurancePolicy] 