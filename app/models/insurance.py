from sqlalchemy import Boolean, Column, Integer, String, Float, Date, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
import enum
from datetime import date

from app.db import Base


class InsuranceType(str, enum.Enum):
    """Enum for different insurance types."""
    LIFE = "LIFE"
    DISABILITY = "DISABILITY"
    CRITICAL_ILLNESS = "CRITICAL_ILLNESS"
    LONG_TERM_CARE = "LONG_TERM_CARE"
    HEALTH = "HEALTH"
    HOME = "HOME"
    AUTO = "AUTO"
    OTHER = "OTHER"


class InsurancePolicy(Base):
    """Insurance policy model for tracking various insurance policies."""
    __tablename__ = "insurance_policies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    family_member_id = Column(Integer, ForeignKey("family_members.id"), nullable=False)
    
    name = Column(String, nullable=False)
    policy_number = Column(String, nullable=True)
    insurance_type = Column(Enum(InsuranceType), nullable=False)
    provider = Column(String, nullable=True)
    
    coverage_amount = Column(Float, nullable=False, default=0.0)
    premium_amount = Column(Float, nullable=False, default=0.0)  # Annual premium
    premium_payment_frequency = Column(String, nullable=True)  # "monthly", "annual", etc.
    
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)  # If term policy
    
    is_term = Column(Boolean, default=True)  # Is it a term policy or permanent
    is_taxable_benefit = Column(Boolean, default=False)  # Is the death benefit taxable
    notes = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="insurance_policies")
    family_member = relationship("FamilyMember", back_populates="insurance_policies")
    
    def __repr__(self):
        return f"<InsurancePolicy {self.name} ({self.insurance_type})>" 