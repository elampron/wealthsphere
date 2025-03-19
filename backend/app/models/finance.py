from sqlalchemy import Boolean, Column, Integer, String, Float, Date, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import expression
import enum
from datetime import date

from app.db import Base


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


class AssetType(str, enum.Enum):
    """Enum for different asset types."""
    PRIMARY_RESIDENCE = "PRIMARY_RESIDENCE"
    SECONDARY_PROPERTY = "SECONDARY_PROPERTY"
    BUSINESS = "BUSINESS"
    VEHICLE = "VEHICLE"
    OTHER = "OTHER"


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


class EntityType(str, enum.Enum):
    """Enum for different entity types used in ValueRecord."""
    INVESTMENT_ACCOUNT = "investment_account"
    ASSET = "asset"
    INCOME_SOURCE = "income_source"
    EXPENSE = "expense"


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
    value_records = relationship("ValueRecord", 
                              primaryjoin="and_(ValueRecord.entity_type == 'investment_account', "
                                          "ValueRecord.entity_id == InvestmentAccount.id)",
                              back_populates="entity_investment_account",
                              foreign_keys="[ValueRecord.entity_id]")
    
    def __repr__(self):
        return f"<InvestmentAccount {self.name} ({self.account_type})>"


class Asset(Base):
    """Asset model for tracking non-investment assets like properties and businesses."""
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    name = Column(String, nullable=False)
    asset_type = Column(Enum(AssetType), nullable=False)
    expected_annual_appreciation = Column(Float, nullable=False, default=0.0)  # As decimal
    is_primary_residence = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="assets")
    value_records = relationship("ValueRecord", 
                              primaryjoin="and_(ValueRecord.entity_type == 'asset', "
                                          "ValueRecord.entity_id == Asset.id)",
                              back_populates="entity_asset",
                              foreign_keys="[ValueRecord.entity_id]")
    
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
    is_taxable = Column(Boolean, default=True)
    start_year = Column(Integer, nullable=False)  # Year this income starts
    end_year = Column(Integer, nullable=True)  # Year this income ends (if applicable)
    expected_growth_rate = Column(Float, nullable=False, default=0.0)  # Annual growth rate as decimal
    notes = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="income_sources")
    family_member = relationship("FamilyMember", back_populates="income_sources")
    value_records = relationship("ValueRecord", 
                              primaryjoin="and_(ValueRecord.entity_type == 'income_source', "
                                          "ValueRecord.entity_id == IncomeSource.id)",
                              back_populates="entity_income_source",
                              foreign_keys="[ValueRecord.entity_id]")
    
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
    value_records = relationship("ValueRecord", 
                              primaryjoin="and_(ValueRecord.entity_type == 'expense', "
                                          "ValueRecord.entity_id == Expense.id)",
                              back_populates="entity_expense",
                              foreign_keys="[ValueRecord.entity_id]")
    
    def __repr__(self):
        return f"<Expense {self.name} ({self.expense_type})>"


class ValueRecord(Base):
    """Value record model for storing monetary values for any entity across scenarios."""
    __tablename__ = "value_records"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(Enum(EntityType), nullable=False)
    entity_id = Column(Integer, nullable=False)
    scenario_id = Column(Integer, ForeignKey("scenarios.id"), nullable=False)
    value_date = Column(Date, nullable=False)
    value_amount = Column(Float, nullable=False)
    
    # Relationship to the scenario
    scenario = relationship("Scenario", back_populates="value_records")
    
    # Polymorphic relationships to actual entities
    entity_investment_account = relationship("InvestmentAccount", 
                                          foreign_keys=[entity_id],
                                          primaryjoin="and_(ValueRecord.entity_type == 'investment_account', "
                                                      "ValueRecord.entity_id == InvestmentAccount.id)",
                                          back_populates="value_records",
                                          viewonly=True)
    entity_asset = relationship("Asset", 
                             foreign_keys=[entity_id],
                             primaryjoin="and_(ValueRecord.entity_type == 'asset', "
                                         "ValueRecord.entity_id == Asset.id)",
                             back_populates="value_records",
                             viewonly=True)
    entity_income_source = relationship("IncomeSource", 
                                     foreign_keys=[entity_id],
                                     primaryjoin="and_(ValueRecord.entity_type == 'income_source', "
                                                 "ValueRecord.entity_id == IncomeSource.id)",
                                     back_populates="value_records",
                                     viewonly=True)
    entity_expense = relationship("Expense", 
                               foreign_keys=[entity_id],
                               primaryjoin="and_(ValueRecord.entity_type == 'expense', "
                                           "ValueRecord.entity_id == Expense.id)",
                               back_populates="value_records",
                               viewonly=True)
    
    def __repr__(self):
        return f"<ValueRecord {self.entity_type}:{self.entity_id} scenario:{self.scenario_id} amount:{self.value_amount}>" 