from sqlalchemy import Boolean, Column, Integer, String, Float, Date, ForeignKey, Enum, Text, DateTime
from sqlalchemy.orm import relationship, Session
import enum
from datetime import date, datetime
from typing import Optional

from app.db import Base
from app.models.entity_value import EntityValue


class AccountType(str, enum.Enum):
    """Enum for different investment account types in Canada."""
    RRSP = "RRSP"  # Registered Retirement Savings Plan
    TFSA = "TFSA"  # Tax-Free Savings Account
    NON_REGISTERED = "NON_REGISTERED"  # Taxable investment account
    RRIF = "RRIF"  # Registered Retirement Income Fund (RRSP converts to this)
    RESP = "RESP"  # Registered Education Savings Plan
    LIRA = "LIRA"  # Locked-In Retirement Account
    FHSA = "FHSA"  # First Home Savings Account
    CORPORATION = "CORPORATION"  # Corporate investment account
    CHECKING = "checking"
    SAVINGS = "savings"
    INVESTMENT = "investment"
    RETIREMENT = "retirement"
    OTHER = "other"


class AssetType(str, enum.Enum):
    """Enum for different asset types."""
    PRIMARY_RESIDENCE = "PRIMARY_RESIDENCE"
    SECONDARY_PROPERTY = "SECONDARY_PROPERTY"
    BUSINESS = "BUSINESS"
    VEHICLE = "VEHICLE"
    OTHER = "OTHER"
    REAL_ESTATE = "real_estate"
    COLLECTIBLE = "collectible"


class IncomeType(str, enum.Enum):
    """Enum for different income types."""
    SALARY = "SALARY"
    BUSINESS_INCOME = "BUSINESS_INCOME"
    PENSION = "PENSION"
    CPP = "CPP"  # Canada Pension Plan
    OAS = "OAS"  # Old Age Security
    GIS = "GIS"  # Guaranteed Income Supplement
    DIVIDEND = "DIVIDEND"
    INTEREST = "INTEREST"
    CAPITAL_GAIN = "CAPITAL_GAIN"
    RENTAL = "RENTAL"
    OTHER = "OTHER"
    INVESTMENT = "investment"


class ExpenseType(str, enum.Enum):
    """Enum for different expense types."""
    HOUSING = "HOUSING"
    TRANSPORTATION = "TRANSPORTATION"
    FOOD = "FOOD"
    UTILITIES = "UTILITIES"
    HEALTHCARE = "HEALTHCARE"
    INSURANCE = "INSURANCE"
    ENTERTAINMENT = "ENTERTAINMENT"
    TRAVEL = "TRAVEL"
    EDUCATION = "EDUCATION"
    SPECIAL = "SPECIAL"  # One-time special expenses
    OTHER = "OTHER"
    DEBT = "debt"


class InvestmentAccount(Base):
    """Investment account model for tracking different types of accounts."""
    __tablename__ = "investment_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    family_member_id = Column(Integer, ForeignKey("family_members.id"), nullable=False)
    
    name = Column(String, nullable=False)
    account_type = Column(Enum(AccountType), nullable=False)
    institution = Column(String, nullable=True)
    expected_return_rate = Column(Float, nullable=False, default=0.0)  # Annual return rate as decimal (e.g., 0.07 for 7%)
    is_taxable = Column(Boolean, default=False)  # For special cases
    notes = Column(Text, nullable=True)
    
    # Account-specific fields
    contribution_room = Column(Float, nullable=True)  # For TFSA, RRSP
    expected_conversion_year = Column(Integer, nullable=True)  # For RRSP → RRIF conversion
    
    # Relationships
    user = relationship("User", back_populates="investment_accounts")
    family_member = relationship("FamilyMember", back_populates="investment_accounts")
    
    def get_latest_value(self, db: Session, scenario_id: int) -> Optional[float]:
        """Get the latest value for this account in the given scenario."""
        latest_value = db.query(EntityValue).filter(
            EntityValue.entity_type == "INVESTMENT_ACCOUNT",
            EntityValue.entity_id == self.id,
            EntityValue.scenario_id == scenario_id
        ).order_by(EntityValue.recorded_at.desc()).first()
        return latest_value.value if latest_value else None

    def set_value(self, db: Session, scenario_id: int, value: float, recorded_at: Optional[datetime] = None) -> EntityValue:
        """Set a new value for this account in the given scenario."""
        if recorded_at is None:
            recorded_at = datetime.utcnow()
        
        entity_value = EntityValue(
            entity_type="INVESTMENT_ACCOUNT",
            entity_id=self.id,
            scenario_id=scenario_id,
            value=value,
            recorded_at=recorded_at
        )
        db.add(entity_value)
        db.commit()
        db.refresh(entity_value)
        return entity_value
    
    def __repr__(self):
        return f"<InvestmentAccount {self.name} ({self.account_type})>"


class Asset(Base):
    """Asset model for tracking non-investment assets like properties and businesses."""
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    name = Column(String, nullable=False)
    asset_type = Column(Enum(AssetType), nullable=False)
    purchase_value = Column(Float, nullable=True)
    purchase_date = Column(Date, nullable=True)
    expected_annual_appreciation = Column(Float, nullable=False, default=0.0)  # As decimal
    is_primary_residence = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="assets")
    
    def get_latest_value(self, db: Session, scenario_id: int) -> Optional[float]:
        """Get the latest value for this asset in the given scenario."""
        latest_value = db.query(EntityValue).filter(
            EntityValue.entity_type == "ASSET",
            EntityValue.entity_id == self.id,
            EntityValue.scenario_id == scenario_id
        ).order_by(EntityValue.recorded_at.desc()).first()
        return latest_value.value if latest_value else None

    def set_value(self, db: Session, scenario_id: int, value: float, recorded_at: Optional[datetime] = None) -> EntityValue:
        """Set a new value for this asset in the given scenario."""
        if recorded_at is None:
            recorded_at = datetime.utcnow()
        
        entity_value = EntityValue(
            entity_type="ASSET",
            entity_id=self.id,
            scenario_id=scenario_id,
            value=value,
            recorded_at=recorded_at
        )
        db.add(entity_value)
        db.commit()
        db.refresh(entity_value)
        return entity_value
    
    def __repr__(self):
        return f"<Asset {self.name} ({self.asset_type})>"


class IncomeSource(Base):
    """Income source model for tracking various income streams."""
    __tablename__ = "income_sources"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    family_member_id = Column(Integer, ForeignKey("family_members.id"), nullable=False)
    
    name = Column(String, nullable=False)
    income_type = Column(Enum(IncomeType), nullable=False)
    amount = Column(Float, nullable=False, default=0.0)  # Annual amount
    is_taxable = Column(Boolean, default=True)
    start_year = Column(Integer, nullable=False)  # Year this income starts
    end_year = Column(Integer, nullable=True)  # Year this income ends (if applicable)
    expected_growth_rate = Column(Float, nullable=False, default=0.0)  # Annual growth rate as decimal
    notes = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="income_sources")
    family_member = relationship("FamilyMember", back_populates="income_sources")
    
    def __repr__(self):
        return f"<IncomeSource {self.name} ({self.income_type})>"


class Expense(Base):
    """Expense model for tracking various expense categories."""
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    name = Column(String, nullable=False)
    expense_type = Column(Enum(ExpenseType), nullable=False)
    category = Column(String, nullable=True)  # Adding category field
    amount = Column(Float, nullable=False, default=0.0)  # Annual amount
    start_year = Column(Integer, nullable=False)  # Year this expense starts
    end_year = Column(Integer, nullable=True)  # Year this expense ends (if applicable)
    expected_growth_rate = Column(Float, nullable=False, default=0.0)  # Annual growth rate as decimal
    is_tax_deductible = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    
    # For special expenses, we might want to indicate which family member they're for
    family_member_id = Column(Integer, ForeignKey("family_members.id"), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="expenses")
    family_member = relationship("FamilyMember", back_populates="expenses", foreign_keys=[family_member_id])
    
    def __repr__(self):
        return f"<Expense {self.name} ({self.expense_type})>" 