from sqlalchemy import Boolean, Column, Integer, String, Date
from sqlalchemy.orm import relationship

from app.db import Base


class User(Base):
    """User model for authentication and basic profile information."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    family_members = relationship("FamilyMember", back_populates="user")
    investment_accounts = relationship("InvestmentAccount", back_populates="user")
    assets = relationship("Asset", back_populates="user")
    income_sources = relationship("IncomeSource", back_populates="user")
    expenses = relationship("Expense", back_populates="user")
    insurance_policies = relationship("InsurancePolicy", back_populates="user")
    scenarios = relationship("Scenario", back_populates="user")
    
    def __repr__(self):
        return f"<User {self.email}>" 