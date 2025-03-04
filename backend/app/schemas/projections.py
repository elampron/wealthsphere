from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Union
from datetime import date
from enum import Enum


class ProjectionParameters(BaseModel):
    """Parameters for generating financial projections."""
    start_year: int = Field(..., description="The starting year for projections")
    end_year: int = Field(..., description="The ending year for projections")
    inflation_rate: Optional[float] = Field(0.02, description="Expected inflation rate as decimal (e.g., 0.02 for 2%)")
    province: Optional[str] = Field("ON", description="Province code for tax calculations")
    

class NetWorthCategory(BaseModel):
    """Breakdown of net worth by category."""
    rrsp_total: float
    tfsa_total: float
    non_registered_total: float
    rrif_total: float
    other_investments_total: float
    property_total: float
    business_total: float
    other_assets_total: float


class NetWorthProjection(NetWorthCategory):
    """Net worth projection for a specific year."""
    total_net_worth: float


class AccountWithdrawal(BaseModel):
    """Details of a withdrawal from an investment account."""
    account_name: str
    account_type: str
    family_member_name: str
    start_value: float
    withdrawal: float
    end_value: float


class WithdrawalStrategy(BaseModel):
    """Withdrawal strategy details."""
    shortfall: float
    withdrawals: Dict[str, float]
    remaining_balance: Dict[str, float]
    unfunded_amount: Optional[float] = 0


class DeathBenefit(BaseModel):
    """Death benefit payment details."""
    family_member_id: int
    family_member_name: str
    benefit_amount: float


class CashFlowProjection(BaseModel):
    """Cash flow projection for a specific year."""
    total_income: float
    total_expenses: float
    net_cash_flow: float
    withdrawal_strategy: Optional[WithdrawalStrategy] = None
    death_benefits: List[DeathBenefit] = []


class WithdrawalStrategyResult(BaseModel):
    """Detailed withdrawal strategy results."""
    shortfall: float
    unfunded_amount: float
    account_details: Dict[str, AccountWithdrawal]


class ScenarioType(str, Enum):
    """Type of projection scenario."""
    BASE = "BASE"
    EARLY_RETIREMENT = "EARLY_RETIREMENT"
    MARKET_DOWNTURN = "MARKET_DOWNTURN"
    HIGH_INFLATION = "HIGH_INFLATION"
    EXTENDED_LIFE = "EXTENDED_LIFE"
    CUSTOM = "CUSTOM"


class ScenarioParameters(ProjectionParameters):
    """Parameters for scenario planning projections."""
    scenario_type: ScenarioType
    custom_parameters: Optional[Dict[str, Union[float, int, str]]] = None
    description: Optional[str] = None 