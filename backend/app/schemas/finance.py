from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from enum import Enum

# Enums for validation
class AccountTypeEnum(str, Enum):
    RRSP = "RRSP"
    TFSA = "TFSA"
    NON_REGISTERED = "NON_REGISTERED"
    RRIF = "RRIF"
    RESP = "RESP"
    LIRA = "LIRA"
    FHSA = "FHSA"
    CORPORATION = "CORPORATION"


class AssetTypeEnum(str, Enum):
    PRIMARY_RESIDENCE = "PRIMARY_RESIDENCE"
    SECONDARY_PROPERTY = "SECONDARY_PROPERTY"
    BUSINESS = "BUSINESS"
    VEHICLE = "VEHICLE"
    OTHER = "OTHER"


class IncomeTypeEnum(str, Enum):
    SALARY = "SALARY"
    BUSINESS_INCOME = "BUSINESS_INCOME"
    PENSION = "PENSION"
    CPP = "CPP"
    OAS = "OAS"
    GIS = "GIS"
    DIVIDEND = "DIVIDEND"
    INTEREST = "INTEREST"
    CAPITAL_GAIN = "CAPITAL_GAIN"
    RENTAL = "RENTAL"
    OTHER = "OTHER"


class ExpenseTypeEnum(str, Enum):
    HOUSING = "HOUSING"
    TRANSPORTATION = "TRANSPORTATION"
    FOOD = "FOOD"
    UTILITIES = "UTILITIES"
    HEALTHCARE = "HEALTHCARE"
    INSURANCE = "INSURANCE"
    ENTERTAINMENT = "ENTERTAINMENT"
    TRAVEL = "TRAVEL"
    EDUCATION = "EDUCATION"
    SPECIAL = "SPECIAL"
    OTHER = "OTHER"


# Investment Account Schemas
class InvestmentAccountBase(BaseModel):
    """Base investment account schema with common attributes."""
    name: str
    account_type: AccountTypeEnum
    institution: Optional[str] = None
    current_balance: float = Field(0.0, ge=0.0)
    expected_return_rate: float = Field(0.0, ge=-1.0, le=1.0)  # Allow for small negative returns
    is_taxable: bool = False
    notes: Optional[str] = None
    contribution_room: Optional[float] = None
    expected_conversion_year: Optional[int] = None


class InvestmentAccountCreate(InvestmentAccountBase):
    """Schema for creating a new investment account."""
    family_member_id: int


class InvestmentAccountUpdate(BaseModel):
    """Schema for updating investment account information."""
    name: Optional[str] = None
    account_type: Optional[AccountTypeEnum] = None
    institution: Optional[str] = None
    current_balance: Optional[float] = Field(None, ge=0.0)
    expected_return_rate: Optional[float] = Field(None, ge=-1.0, le=1.0)
    is_taxable: Optional[bool] = None
    notes: Optional[str] = None
    contribution_room: Optional[float] = None
    expected_conversion_year: Optional[int] = None
    family_member_id: Optional[int] = None


class InvestmentAccount(InvestmentAccountBase):
    """Schema for investment account information returned to clients."""
    id: int
    user_id: int
    family_member_id: int

    class Config:
        from_attributes = True


# Asset Schemas
class AssetBase(BaseModel):
    """Base asset schema with common attributes."""
    name: str
    asset_type: AssetTypeEnum
    current_value: float = Field(0.0, ge=0.0)
    purchase_value: Optional[float] = Field(None, ge=0.0)
    purchase_date: Optional[date] = None
    expected_annual_appreciation: float = Field(0.0, ge=-1.0, le=1.0)
    is_primary_residence: bool = False
    notes: Optional[str] = None


class AssetCreate(AssetBase):
    """Schema for creating a new asset."""
    pass


class AssetUpdate(BaseModel):
    """Schema for updating asset information."""
    name: Optional[str] = None
    asset_type: Optional[AssetTypeEnum] = None
    current_value: Optional[float] = Field(None, ge=0.0)
    purchase_value: Optional[float] = Field(None, ge=0.0)
    purchase_date: Optional[date] = None
    expected_annual_appreciation: Optional[float] = Field(None, ge=-1.0, le=1.0)
    is_primary_residence: Optional[bool] = None
    notes: Optional[str] = None


class Asset(AssetBase):
    """Schema for asset information returned to clients."""
    id: int
    user_id: int

    class Config:
        from_attributes = True


# Income Source Schemas
class IncomeSourceBase(BaseModel):
    """Base income source schema with common attributes."""
    name: str
    income_type: IncomeTypeEnum
    amount: float = Field(0.0, ge=0.0)
    is_taxable: bool = True
    start_year: int
    end_year: Optional[int] = None
    expected_growth_rate: float = Field(0.0, ge=-1.0, le=1.0)
    notes: Optional[str] = None


class IncomeSourceCreate(IncomeSourceBase):
    """Schema for creating a new income source."""
    family_member_id: int


class IncomeSourceUpdate(BaseModel):
    """Schema for updating income source information."""
    name: Optional[str] = None
    income_type: Optional[IncomeTypeEnum] = None
    amount: Optional[float] = Field(None, ge=0.0)
    is_taxable: Optional[bool] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    expected_growth_rate: Optional[float] = Field(None, ge=-1.0, le=1.0)
    notes: Optional[str] = None
    family_member_id: Optional[int] = None


class IncomeSource(IncomeSourceBase):
    """Schema for income source information returned to clients."""
    id: int
    user_id: int
    family_member_id: int

    class Config:
        from_attributes = True


# Expense Schemas
class ExpenseBase(BaseModel):
    """Base expense schema with common attributes."""
    name: str
    expense_type: ExpenseTypeEnum
    amount: float = Field(0.0, ge=0.0)
    category: Optional[str] = None
    start_year: int
    end_year: Optional[int] = None
    expected_growth_rate: float = Field(0.0, ge=-1.0, le=1.0)
    is_tax_deductible: bool = False
    notes: Optional[str] = None
    family_member_id: Optional[int] = None


class ExpenseCreate(ExpenseBase):
    """Schema for creating a new expense."""
    pass


class ExpenseUpdate(BaseModel):
    """Schema for updating expense information."""
    name: Optional[str] = None
    expense_type: Optional[ExpenseTypeEnum] = None
    amount: Optional[float] = Field(None, ge=0.0)
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    expected_growth_rate: Optional[float] = Field(None, ge=-1.0, le=1.0)
    is_tax_deductible: Optional[bool] = None
    notes: Optional[str] = None
    family_member_id: Optional[int] = None


class Expense(ExpenseBase):
    """Schema for expense information returned to clients."""
    id: int
    user_id: int

    class Config:
        from_attributes = True


# List schemas
class InvestmentAccountList(BaseModel):
    """Schema for a list of investment accounts."""
    accounts: List[InvestmentAccount]


class AssetList(BaseModel):
    """Schema for a list of assets."""
    assets: List[Asset]


class IncomeSourceList(BaseModel):
    """Schema for a list of income sources."""
    income_sources: List[IncomeSource]


class ExpenseList(BaseModel):
    """Schema for a list of expenses."""
    expenses: List[Expense]


class ExpenseCopyRequest(BaseModel):
    """Schema for copying an expense to multiple years."""
    target_years: List[int] = Field(..., description="The years to copy the expense to")
    adjust_amount: Optional[float] = Field(None, ge=0.0, description="Optional adjusted amount for the copied expenses")
    end_year: Optional[int] = Field(None, description="Optional end year for the copied expenses") 