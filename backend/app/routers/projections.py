from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from datetime import date, datetime

from app.db import get_db_session
from app.models import (
    FamilyMember,
    InvestmentAccount,
    Asset,
    IncomeSource,
    Expense,
    InsurancePolicy,
    AccountType,
    Scenario
)
from app.schemas import (
    NetWorthProjection,
    CashFlowProjection,
    WithdrawalStrategyResult,
    ProjectionParameters
)
from app.routers.auth import get_current_user
from app.schemas import User
from app.services.calculations import (
    is_alive,
    calculate_age,
    calculate_rrsp_to_rrif_conversion,
    calculate_net_worth,
    calculate_cash_flow,
    calculate_account_growth,
    calculate_asset_growth,
    calculate_withdrawal_strategy,
    calculate_death_benefit,
    calculate_rrif_minimum_withdrawal,
    get_account_value,
    get_asset_value,
    project_account_value,
    project_asset_value,
    calculate_cpp_benefit,
    calculate_oas_benefit
)


router = APIRouter()


@router.post("/projections/net-worth", response_model=Dict[str, Dict[str, float]])
def project_net_worth(
    params: ProjectionParameters,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Generate net worth projections for each year from start_year to end_year.
    Returns a dictionary with yearly net worth values and a breakdown by asset/account type.
    """
    # Get all user data needed for projections
    family_members = db.query(FamilyMember).filter(FamilyMember.user_id == current_user.id).all()
    investment_accounts = db.query(InvestmentAccount).filter(InvestmentAccount.user_id == current_user.id).all()
    assets = db.query(Asset).filter(Asset.user_id == current_user.id).all()
    
    print(f"Starting projections with {len(investment_accounts)} accounts and {len(assets)} assets")
    for account in investment_accounts:
        print(f"Account: {account.name}, Type: {account.account_type}, Balance: ${account.current_balance:,.2f}")
    
    for asset in assets:
        print(f"Asset: {asset.name}, Type: {asset.asset_type}, Value: ${asset.current_value:,.2f}")
    
    # Make a copy of the investment accounts to avoid modifying the original data
    # This prevents the RRSP to RRIF conversion from affecting the database
    investment_accounts_copy = []
    for account in investment_accounts:
        account_copy = InvestmentAccount(
            id=account.id,
            user_id=account.user_id,
            family_member_id=account.family_member_id,
            name=account.name,
            account_type=account.account_type,
            institution=account.institution,
            current_balance=account.current_balance,
            expected_return_rate=account.expected_return_rate,
            is_taxable=account.is_taxable,
            notes=account.notes,
            contribution_room=account.contribution_room,
            expected_conversion_year=account.expected_conversion_year
        )
        investment_accounts_copy.append(account_copy)
    
    # Track projected account values by year
    projected_accounts = {}
    
    # Get current year for baseline
    current_year = date.today().year
    
    # Generate year-by-year projections
    yearly_projections = {}
    
    for year in range(params.start_year, params.end_year + 1):
        print(f"\nProjecting for year {year}")
        # Initialize tracking for this year
        if year not in projected_accounts:
            projected_accounts[year] = {}
            
        # RRSP to RRIF conversions that should happen in this year
        for account in investment_accounts_copy:
            member = next((m for m in family_members if m.id == account.family_member_id), None)
            if not member:
                continue
                
            # Check if this account should convert from RRSP to RRIF
            if calculate_rrsp_to_rrif_conversion(account, member, year):
                print(f"Converting account {account.name} from RRSP to RRIF in year {year}")
                # Convert the account for projections - note this doesn't affect the database
                account.account_type = AccountType.RRIF
        
        # Calculate projected account values for this year
        for account in investment_accounts_copy:
            # Skip projections for deceased account holders
            member = next((m for m in family_members if m.id == account.family_member_id), None)
            if not member or not is_alive(member, year):
                projected_accounts[year][account.id] = 0
                continue
                
            # Calculate growth for this account
            projected_accounts[year][account.id] = calculate_account_growth(
                account, 
                year, 
                projected_accounts
            )
        
        # Calculate net worth for this year
        net_worth = calculate_net_worth(
            family_members,
            investment_accounts_copy,
            assets,
            year,
            current_year,
            projected_accounts
        )
        
        # Breakdown by category
        rrsp_total = sum(
            projected_accounts[year].get(a.id, a.current_balance) 
            for a in investment_accounts_copy 
            if a.account_type == AccountType.RRSP
        )
        
        tfsa_total = sum(
            projected_accounts[year].get(a.id, a.current_balance) 
            for a in investment_accounts_copy 
            if a.account_type == AccountType.TFSA
        )
        
        non_registered_total = sum(
            projected_accounts[year].get(a.id, a.current_balance) 
            for a in investment_accounts_copy 
            if a.account_type == AccountType.NON_REGISTERED
        )
        
        rrif_total = sum(
            projected_accounts[year].get(a.id, a.current_balance) 
            for a in investment_accounts_copy 
            if a.account_type == AccountType.RRIF
        )
        
        other_investments_total = sum(
            projected_accounts[year].get(a.id, a.current_balance) 
            for a in investment_accounts_copy 
            if a.account_type not in [AccountType.RRSP, AccountType.TFSA, AccountType.NON_REGISTERED, AccountType.RRIF]
        )
        
        # Sum up assets by type
        property_total = sum(
            calculate_asset_growth(a, year, current_year)
            for a in assets
            if a.asset_type in ["PRIMARY_RESIDENCE", "SECONDARY_PROPERTY"]
        )
        
        business_total = sum(
            calculate_asset_growth(a, year, current_year)
            for a in assets
            if a.asset_type == "BUSINESS"
        )
        
        other_assets_total = sum(
            calculate_asset_growth(a, year, current_year)
            for a in assets
            if a.asset_type not in ["PRIMARY_RESIDENCE", "SECONDARY_PROPERTY", "BUSINESS"]
        )
        
        yearly_projections[str(year)] = {
            "total_net_worth": net_worth,
            "rrsp_total": rrsp_total,
            "tfsa_total": tfsa_total,
            "non_registered_total": non_registered_total,
            "rrif_total": rrif_total,
            "other_investments_total": other_investments_total,
            "property_total": property_total,
            "business_total": business_total,
            "other_assets_total": other_assets_total
        }
        
        print(f"Year {year} projection: Net Worth = ${net_worth:,.2f}")
        print(f"  RRSP: ${rrsp_total:,.2f}")
        print(f"  TFSA: ${tfsa_total:,.2f}")
        print(f"  Non-Registered: ${non_registered_total:,.2f}")
        print(f"  RRIF: ${rrif_total:,.2f}")
        print(f"  Property: ${property_total:,.2f}")
        print(f"  Business: ${business_total:,.2f}")
        print(f"  Other Assets: ${other_assets_total:,.2f}")
    
    return yearly_projections


@router.post("/projections/cash-flow", response_model=Dict[str, CashFlowProjection])
def project_cash_flow(
    params: ProjectionParameters,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Generate cash flow projections for each year from start_year to end_year.
    Returns a dictionary with yearly cash flow details including income, expenses,
    and withdrawal strategies.
    """
    # Get all user data needed for projections
    family_members = db.query(FamilyMember).filter(FamilyMember.user_id == current_user.id).all()
    investment_accounts = db.query(InvestmentAccount).filter(InvestmentAccount.user_id == current_user.id).all()
    income_sources = db.query(IncomeSource).filter(IncomeSource.user_id == current_user.id).all()
    expenses = db.query(Expense).filter(Expense.user_id == current_user.id).all()
    insurance_policies = db.query(InsurancePolicy).filter(InsurancePolicy.user_id == current_user.id).all()
    
    # Track projected account values by year
    projected_accounts = {}
    
    # Get current year for baseline
    current_year = date.today().year
    
    # Generate year-by-year projections
    yearly_projections = {}
    
    for year in range(params.start_year, params.end_year + 1):
        # Initialize tracking for this year
        if year not in projected_accounts:
            projected_accounts[year] = {}
        
        # RRSP to RRIF conversions that should happen in this year
        for account in investment_accounts:
            member = next((m for m in family_members if m.id == account.family_member_id), None)
            if not member:
                continue
                
            # Check if this account should convert from RRSP to RRIF
            if calculate_rrsp_to_rrif_conversion(account, member, year):
                # Create new RRIF account for projections
                account.account_type = AccountType.RRIF
        
        # Calculate cash flow for this year
        cash_flow = calculate_cash_flow(
            family_members,
            income_sources,
            expenses,
            insurance_policies,
            year,
            current_year
        )
        
        # Calculate withdrawal strategy if income doesn't cover expenses
        withdrawal_strategy = None
        if cash_flow["net_cash_flow"] < 0:
            withdrawal_strategy = calculate_withdrawal_strategy(
                family_members,
                investment_accounts,
                income_sources,
                expenses,
                year,
                current_year,
                projected_accounts
            )
            
            # Update projected account values after withdrawals
            for account_id, remaining in withdrawal_strategy["remaining_balance"].items():
                projected_accounts[year][account_id] = remaining
        else:
            # No withdrawals needed, update account values with growth only
            for account in investment_accounts:
                # Skip projections for deceased account holders
                member = next((m for m in family_members if m.id == account.family_member_id), None)
                if not member or not is_alive(member, year):
                    projected_accounts[year][account.id] = 0
                    continue
                    
                # Calculate growth for this account
                projected_accounts[year][account.id] = calculate_account_growth(
                    account, 
                    year, 
                    projected_accounts
                )
        
        # Check for deaths in this year and add death benefits
        death_benefits = []
        for member in family_members:
            # If they're alive this year but not next year
            if is_alive(member, year) and not is_alive(member, year + 1):
                benefit = calculate_death_benefit(member, insurance_policies, year)
                if benefit > 0:
                    death_benefits.append({
                        "family_member_id": member.id,
                        "family_member_name": f"{member.first_name} {member.last_name}",
                        "benefit_amount": benefit
                    })
        
        # Store the year's projection
        yearly_projections[str(year)] = {
            "total_income": cash_flow["total_income"],
            "total_expenses": cash_flow["total_expenses"],
            "net_cash_flow": cash_flow["net_cash_flow"],
            "withdrawal_strategy": withdrawal_strategy,
            "death_benefits": death_benefits
        }
    
    return yearly_projections


@router.post("/projections/detailed-withdrawals", response_model=Dict[str, WithdrawalStrategyResult])
def project_detailed_withdrawals(
    params: ProjectionParameters,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Generate detailed withdrawal strategy projections for retirement planning.
    """
    # Get all user data needed for projections
    family_members = db.query(FamilyMember).filter(FamilyMember.user_id == current_user.id).all()
    investment_accounts = db.query(InvestmentAccount).filter(InvestmentAccount.user_id == current_user.id).all()
    income_sources = db.query(IncomeSource).filter(IncomeSource.user_id == current_user.id).all()
    expenses = db.query(Expense).filter(Expense.user_id == current_user.id).all()
    
    # Track projected account values by year
    projected_accounts = {}
    
    # Get current year for baseline
    current_year = date.today().year
    
    # Generate year-by-year projections
    yearly_projections = {}
    
    for year in range(params.start_year, params.end_year + 1):
        # Initialize tracking for this year
        if year not in projected_accounts:
            projected_accounts[year] = {}
        
        # RRSP to RRIF conversions that should happen in this year
        for account in investment_accounts:
            member = next((m for m in family_members if m.id == account.family_member_id), None)
            if not member:
                continue
                
            # Check if this account should convert from RRSP to RRIF
            if calculate_rrsp_to_rrif_conversion(account, member, year):
                # Create new RRIF account for projections
                account.account_type = AccountType.RRIF
        
        # Calculate withdrawal strategy 
        withdrawal_strategy = calculate_withdrawal_strategy(
            family_members,
            investment_accounts,
            income_sources,
            expenses,
            year,
            current_year,
            projected_accounts
        )
        
        # Update projected account values after withdrawals
        for account_id, remaining in withdrawal_strategy["remaining_balance"].items():
            projected_accounts[year][account_id] = remaining
            
        # For accounts not in the withdrawal strategy, still calculate growth
        for account in investment_accounts:
            if account.id not in withdrawal_strategy["remaining_balance"]:
                # Skip projections for deceased account holders
                member = next((m for m in family_members if m.id == account.family_member_id), None)
                if not member or not is_alive(member, year):
                    projected_accounts[year][account.id] = 0
                    continue
                    
                # Calculate growth for this account
                projected_accounts[year][account.id] = calculate_account_growth(
                    account, 
                    year, 
                    projected_accounts
                )
        
        # Store withdrawal details
        account_details = {}
        for account in investment_accounts:
            # Get corresponding member
            member = next((m for m in family_members if m.id == account.family_member_id), None)
            if not member:
                continue
            
            # Only include accounts of living members
            if not is_alive(member, year):
                continue
                
            account_value = projected_accounts[year].get(account.id, account.current_balance)
            withdrawal = withdrawal_strategy["withdrawals"].get(account.id, 0)
            
            account_details[str(account.id)] = {
                "account_name": account.name,
                "account_type": account.account_type,
                "family_member_name": f"{member.first_name} {member.last_name}",
                "start_value": account_value + withdrawal,  # before withdrawal
                "withdrawal": withdrawal,
                "end_value": account_value,  # after withdrawal
            }
        
        yearly_projections[str(year)] = {
            "shortfall": withdrawal_strategy["shortfall"],
            "unfunded_amount": withdrawal_strategy.get("unfunded_amount", 0),
            "account_details": account_details
        }
    
    return yearly_projections


@router.get("/net-worth")
def get_net_worth_projection(
    years: int,
    scenario_id: Optional[int] = None,
    start_date: Optional[date] = None,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Project net worth over specified number of years."""
    if start_date is None:
        start_date = date.today()
    
    # Get or use default scenario
    if scenario_id is None:
        scenario = db.query(Scenario).filter(Scenario.name == "Actual").first()
        if not scenario:
            raise HTTPException(status_code=404, detail="Default scenario not found")
        scenario_id = scenario.id
    
    # Get all accounts and assets
    accounts = db.query(InvestmentAccount).filter(
        InvestmentAccount.user_id == current_user.id
    ).all()
    
    assets = db.query(Asset).filter(
        Asset.user_id == current_user.id
    ).all()
    
    # Debug logging
    for account in accounts:
        value = get_account_value(db, account, scenario_id)
        print(f"Account: {account.name}, Type: {account.account_type}, Balance: ${value:,.2f}")
    
    for asset in assets:
        value = get_asset_value(db, asset, scenario_id)
        print(f"Asset: {asset.name}, Type: {asset.asset_type}, Value: ${value:,.2f}")
    
    # Initialize projection data structures
    projected_accounts: Dict[int, Dict[int, float]] = {year: {} for year in range(start_date.year, start_date.year + years + 1)}
    projected_assets: Dict[int, Dict[int, float]] = {year: {} for year in range(start_date.year, start_date.year + years + 1)}
    
    # Project each account
    for account in accounts:
        for year_offset in range(years + 1):
            year = start_date.year + year_offset
            projected_value = project_account_value(db, account, scenario_id, year_offset, start_date)
            projected_accounts[year][account.id] = projected_value
    
    # Project each asset
    for asset in assets:
        for year_offset in range(years + 1):
            year = start_date.year + year_offset
            projected_value = project_asset_value(db, asset, scenario_id, year_offset, start_date)
            projected_assets[year][asset.id] = projected_value
    
    # Calculate total net worth for each year
    net_worth_by_year = {}
    for year in range(start_date.year, start_date.year + years + 1):
        total_accounts = sum(projected_accounts[year].values())
        total_assets = sum(projected_assets[year].values())
        net_worth_by_year[year] = {
            "total": total_accounts + total_assets,
            "accounts": total_accounts,
            "assets": total_assets,
            "details": {
                "accounts": {
                    account.name: projected_accounts[year].get(account.id, get_account_value(db, account, scenario_id))
                    for account in accounts
                },
                "assets": {
                    asset.name: projected_assets[year].get(asset.id, get_asset_value(db, asset, scenario_id))
                    for asset in assets
                }
            }
        }
    
    return net_worth_by_year 