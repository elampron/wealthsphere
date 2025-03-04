from sqlalchemy import Boolean, Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from datetime import date
from typing import Optional

from app.db import Base


class FamilyMember(Base):
    """Family member model for tracking individuals in the family unit."""
    __tablename__ = "family_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=False)
    relationship_type = Column(String, nullable=False)  # e.g., "self", "spouse", "child", "parent"
    is_primary = Column(Boolean, default=False)  # Is this the primary user/account holder
    expected_retirement_age = Column(Integer, nullable=True)
    expected_death_age = Column(Integer, nullable=True, default=90)  # Default life expectancy
    
    # Relationships
    user = relationship("User", back_populates="family_members")
    income_sources = relationship("IncomeSource", back_populates="family_member")
    investment_accounts = relationship("InvestmentAccount", back_populates="family_member")
    expenses = relationship("Expense", back_populates="family_member", foreign_keys="[Expense.family_member_id]")
    insurance_policies = relationship("InsurancePolicy", back_populates="family_member")
    
    def __repr__(self):
        return f"<FamilyMember {self.first_name} {self.last_name}>"
    
    @property
    def age(self) -> int:
        """Calculate current age based on date of birth."""
        today = date.today()
        return today.year - self.date_of_birth.year - \
            ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
    
    @property
    def retirement_year(self) -> Optional[int]:
        """Calculate retirement year based on date of birth and expected retirement age."""
        if not self.expected_retirement_age:
            return None
        return self.date_of_birth.year + self.expected_retirement_age
    
    @property
    def death_year(self) -> int:
        """Calculate expected death year based on date of birth and expected death age."""
        return self.date_of_birth.year + self.expected_death_age 