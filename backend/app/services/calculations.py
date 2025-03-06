from typing import Dict, List, Optional, Tuple
from datetime import date, datetime
import math

from app.models import (
    FamilyMember, 
    InvestmentAccount, 
    Asset, 
    IncomeSource, 
    Expense, 
    InsurancePolicy,
    AccountType
)


def calculate_age(birth_date: date, target_year: int) -> int:
    """Calculate age of a person in a specific year."""
    age_at_year_end = target_year - birth_date.year
    
    # If they haven't had their birthday in the target year yet
    if (birth_date.month, birth_date.day) > (12, 31):
        age_at_year_end -= 1
        
    return max(0, age_at_year_end)


def is_alive(member: FamilyMember, year: int) -> bool:
    """Determine if a family member is alive in a given projection year."""
    age = calculate_age(member.date_of_birth, year)
    
    # Default to max age of 100 if life_expectancy not set
    max_age = member.expected_death_age or 100
    
    return age <= max_age


def calculate_rrsp_to_rrif_conversion(
    account: InvestmentAccount, 
    member: FamilyMember, 
    year: int
) -> bool:
    """
    Determine if an RRSP should be converted to a RRIF in the given year.
    In Canada, RRSP must be converted to RRIF by the end of the year in which
    the account holder turns 71.
    """
    print(f"DEBUG: Checking RRSP conversion for account {account.id} ({account.name}) in year {year}")
    
    if account.account_type != AccountType.RRSP:
        print(f"DEBUG: Account {account.id} is not an RRSP (type: {account.account_type}), skipping conversion check")
        return False
        
    age = calculate_age(member.date_of_birth, year)
    print(f"DEBUG: Family member {member.id} age in year {year}: {age}")
    
    # If explicitly defined in the account
    if account.expected_conversion_year and account.expected_conversion_year == year:
        print(f"DEBUG: Account {account.id} has expected conversion year {account.expected_conversion_year} matching current year {year}")
        return True
        
    # Mandatory conversion at age 71
    if age == 71:
        print(f"DEBUG: Family member {member.id} is 71 in year {year}, triggering mandatory RRSP to RRIF conversion")
        return True
        
    return False


def calculate_rrif_minimum_withdrawal(account_value: float, age: int) -> float:
    """
    Calculate the minimum required RRIF withdrawal based on age.
    These are the 2023 rates in Canada.
    """
    # RRIF minimum withdrawal percentages by age
    min_withdrawal_rates = {
        55: 0.0286, 56: 0.0289, 57: 0.0290, 58: 0.0292, 59: 0.0294,
        60: 0.0297, 61: 0.0300, 62: 0.0303, 63: 0.0307, 64: 0.0310,
        65: 0.0313, 66: 0.0317, 67: 0.0322, 68: 0.0327, 69: 0.0332,
        70: 0.0338, 71: 0.0345, 72: 0.0353, 73: 0.0362, 74: 0.0373,
        75: 0.0385, 76: 0.0397, 77: 0.0411, 78: 0.0426, 79: 0.0444,
        80: 0.0465, 81: 0.0490, 82: 0.0517, 83: 0.0540, 84: 0.0571,
        85: 0.0606, 86: 0.0645, 87: 0.0688, 88: 0.0738, 89: 0.0794,
        90: 0.0859, 91: 0.0929, 92: 0.1014, 93: 0.1115, 94: 0.1235,
        95: 0.1399, 96: 0.1634, 97: 0.1956, 98: 0.2000, 99: 0.2000,
        100: 0.2000
    }
    
    # Default to age 100 rate for ages over 100
    if age >= 100:
        rate = 0.2000
    elif age < 55:
        # The formula for ages under 55 is 1/(90-age)
        rate = 1 / (90 - age)
    else:
        rate = min_withdrawal_rates.get(age, 0.0)
        
    return account_value * rate


def calculate_tax_on_income(income: float, province: str = "ON") -> float:
    """
    Calculate estimated income tax (federal + provincial) on a given income amount.
    This is a simplified approximation of Canadian income tax - real tax calculations
    would need to consider many more factors.
    """
    # Federal tax brackets for 2023
    federal_brackets = [
        (0, 53359, 0.15),
        (53359, 106717, 0.205),
        (106717, 165430, 0.26),
        (165430, 235675, 0.29),
        (235675, float('inf'), 0.33)
    ]
    
    # Provincial tax brackets - simplified for Ontario in this example
    provincial_brackets = {
        "ON": [
            (0, 49231, 0.0505),
            (49231, 98463, 0.0915),
            (98463, 150000, 0.1116),
            (150000, 220000, 0.1216),
            (220000, float('inf'), 0.1316)
        ],
        # Other provinces could be added here
    }
    
    # Use Ontario as default if province not found
    province_brackets = provincial_brackets.get(province, provincial_brackets["ON"])
    
    # Calculate federal tax
    federal_tax = 0
    for min_income, max_income, rate in federal_brackets:
        if income > min_income:
            taxable_in_bracket = min(income, max_income) - min_income
            federal_tax += taxable_in_bracket * rate
    
    # Calculate provincial tax
    provincial_tax = 0
    for min_income, max_income, rate in province_brackets:
        if income > min_income:
            taxable_in_bracket = min(income, max_income) - min_income
            provincial_tax += taxable_in_bracket * rate
    
    return federal_tax + provincial_tax


def calculate_oas_clawback(income: float, year: int = None) -> float:
    """
    Calculate Old Age Security (OAS) clawback amount.
    The OAS clawback, or "recovery tax", reduces OAS payments for high-income seniors.
    """
    # 2023 threshold - in a real implementation, we might adjust for inflation
    # or have a table of projected thresholds
    threshold = 86912
    
    # No clawback if income is below threshold
    if income <= threshold:
        return 0
    
    # 15% of income above threshold
    clawback = (income - threshold) * 0.15
    
    # Maximum clawback is the full OAS amount (around $7,900 annually in 2023)
    max_oas = 7900  # This would be adjusted for inflation in each year
    
    return min(clawback, max_oas)


def calculate_account_growth(
    account: InvestmentAccount, 
    year: int, 
    projected_accounts: Dict[int, Dict[int, float]]
) -> float:
    """
    Calculate the projected account value at the end of a specific year.
    
    Args:
        account: The investment account
        year: The projection year
        projected_accounts: Dict tracking projected account values by year and account_id
    
    Returns:
        The projected account value
    """
    # Get the current value (either from prior year projection or current balance)
    start_value = 0
    
    if year in projected_accounts and account.id in projected_accounts[year]:
        # Use the value from our projections
        start_value = projected_accounts[year][account.id]
    else:
        # For the first projection year, use current balance
        start_value = account.current_balance
    
    # Apply growth based on expected return rate
    end_value = start_value * (1 + account.expected_return_rate)
    
    return end_value


def calculate_asset_growth(asset: Asset, year: int, current_year: int) -> float:
    """
    Calculate the projected asset value at the end of a specific year.
    
    Args:
        asset: The asset
        year: The projection year
        current_year: The current year
    
    Returns:
        The projected asset value
    """
    # Calculate how many years of growth to apply
    years_of_growth = year - current_year
    
    # Apply compound growth based on expected appreciation rate
    projected_value = asset.current_value * ((1 + asset.expected_annual_appreciation) ** years_of_growth)
    
    return projected_value


def calculate_income_for_year(
    income_source: IncomeSource, 
    year: int, 
    current_year: int
) -> float:
    """
    Calculate income from a source for a specific year.
    
    Args:
        income_source: The income source
        year: The projection year
        current_year: The current year
    
    Returns:
        The projected income amount
    """
    # Check if income applies to this year
    if income_source.start_year > year:
        return 0
    
    if income_source.end_year and income_source.end_year < year:
        return 0
    
    # Calculate years of growth
    years_of_growth = year - income_source.start_year
    
    # Apply compound growth based on expected growth rate
    projected_amount = income_source.amount * ((1 + income_source.expected_growth_rate) ** years_of_growth)
    
    return projected_amount


def calculate_expense_for_year(
    expense: Expense, 
    year: int
) -> float:
    """
    Calculate expense amount for a specific year.
    
    Args:
        expense: The expense
        year: The projection year
    
    Returns:
        The projected expense amount
    """
    # Check if expense applies to this year
    if expense.start_year > year:
        return 0
    
    if expense.end_year and expense.end_year < year:
        return 0
    
    # Calculate years of growth
    years_of_growth = year - expense.start_year
    
    # Apply compound growth based on expected growth rate
    projected_amount = expense.amount * ((1 + expense.expected_growth_rate) ** years_of_growth)
    
    return projected_amount


def calculate_net_worth(
    family_members: List[FamilyMember],
    investment_accounts: List[InvestmentAccount],
    assets: List[Asset],
    year: int,
    current_year: int,
    projected_accounts: Dict[int, Dict[int, float]]
) -> float:
    """
    Calculate net worth for a specific projection year.
    
    Args:
        family_members: List of family members
        investment_accounts: List of investment accounts
        assets: List of assets
        year: The projection year
        current_year: The current year
        projected_accounts: Dict tracking projected account values
    
    Returns:
        The projected net worth
    """
    total_net_worth = 0
    
    # Add investment account values
    for account in investment_accounts:
        # Check if account owner is alive
        member = next((m for m in family_members if m.id == account.family_member_id), None)
        if member and is_alive(member, year):
            # Log for debugging
            print(f"Processing account {account.name}, type: {account.account_type}, current balance: {account.current_balance}")
            
            if year in projected_accounts and account.id in projected_accounts[year]:
                account_value = projected_accounts[year][account.id]
                print(f"  Using projected value for year {year}: {account_value}")
                total_net_worth += account_value
            else:
                print(f"  Using current balance: {account.current_balance}")
                total_net_worth += account.current_balance
    
    # Add asset values
    for asset in assets:
        projected_value = calculate_asset_growth(asset, year, current_year)
        print(f"Processing asset {asset.name}, type: {asset.asset_type}, current value: {asset.current_value}, projected: {projected_value}")
        total_net_worth += projected_value
    
    print(f"Total net worth for year {year}: {total_net_worth}")
    return total_net_worth


def calculate_cash_flow(
    family_members: List[FamilyMember],
    income_sources: List[IncomeSource],
    expenses: List[Expense],
    insurance_policies: List[InsurancePolicy],
    year: int,
    current_year: int
) -> Dict:
    """
    Calculate cash flow for a specific projection year.
    
    Args:
        family_members: List of family members
        income_sources: List of income sources
        expenses: List of expenses
        insurance_policies: List of insurance policies
        year: The projection year
        current_year: The current year
    
    Returns:
        Dict with cash flow details
    """
    total_income = 0
    total_expenses = 0
    
    # Filter for living family members
    living_members = [m for m in family_members if is_alive(m, year)]
    living_member_ids = [m.id for m in living_members]
    
    # Calculate income
    for income_source in income_sources:
        # Skip if family member is deceased
        if income_source.family_member_id not in living_member_ids:
            continue
            
        income_amount = calculate_income_for_year(income_source, year, current_year)
        total_income += income_amount
    
    # Calculate expenses
    for expense in expenses:
        # Include all family expenses and expenses for living members
        if expense.family_member_id is None or expense.family_member_id in living_member_ids:
            expense_amount = calculate_expense_for_year(expense, year)
            total_expenses += expense_amount
    
    # Calculate insurance premiums as expenses
    for policy in insurance_policies:
        # Skip if policy holder is deceased
        if policy.family_member_id not in living_member_ids:
            continue
            
        # Only include if policy is active
        current_date = date(year, 12, 31)
        if ((policy.start_date is None or policy.start_date <= current_date) and
                (policy.end_date is None or policy.end_date >= current_date)):
            total_expenses += policy.premium_amount
    
    net_cash_flow = total_income - total_expenses
    
    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_cash_flow": net_cash_flow
    }


def calculate_withdrawal_strategy(
    family_members: List[FamilyMember],
    investment_accounts: List[InvestmentAccount],
    income_sources: List[IncomeSource],
    expenses: List[Expense],
    year: int,
    current_year: int,
    projected_accounts: Dict[int, Dict[int, float]]
) -> Dict:
    """
    Calculate the optimal withdrawal strategy for covering expenses.
    
    Args:
        family_members: List of family members
        investment_accounts: List of investment accounts
        income_sources: List of income sources
        expenses: List of expenses
        year: The projection year
        current_year: The current year
        projected_accounts: Dict tracking projected account values
    
    Returns:
        Dict with withdrawal strategy details
    """
    # Calculate total income and expenses
    living_members = [m for m in family_members if is_alive(m, year)]
    living_member_ids = [m.id for m in living_members]
    
    total_income = sum(
        calculate_income_for_year(income, year, current_year)
        for income in income_sources
        if income.family_member_id in living_member_ids
    )
    
    total_expenses = sum(
        calculate_expense_for_year(expense, year)
        for expense in expenses
        if expense.family_member_id is None or expense.family_member_id in living_member_ids
    )
    
    # Calculate shortfall
    shortfall = max(0, total_expenses - total_income)
    
    if shortfall == 0:
        return {
            "shortfall": 0,
            "withdrawals": {},
            "remaining_balance": {},
        }
    
    # Filter active accounts for living members
    active_accounts = [
        account for account in investment_accounts
        if account.family_member_id in living_member_ids
    ]
    
    # Dictionary to track withdrawals from each account
    withdrawals = {}
    remaining_shortfall = shortfall
    
    # 1. First, withdraw required minimum from RRIFs (mandatory)
    for account in active_accounts:
        if account.account_type == AccountType.RRIF:
            member = next(m for m in family_members if m.id == account.family_member_id)
            age = calculate_age(member.date_of_birth, year)
            
            account_value = projected_accounts.get(year, {}).get(account.id, account.current_balance)
            min_withdrawal = calculate_rrif_minimum_withdrawal(account_value, age)
            
            withdrawals[account.id] = min_withdrawal
            remaining_shortfall -= min_withdrawal
    
    # 2. Then, withdraw from non-registered accounts (taxed as withdrawn)
    if remaining_shortfall > 0:
        for account in active_accounts:
            if account.account_type == AccountType.NON_REGISTERED:
                account_value = projected_accounts.get(year, {}).get(account.id, account.current_balance)
                withdrawal = min(account_value, remaining_shortfall)
                
                withdrawals[account.id] = withdrawals.get(account.id, 0) + withdrawal
                remaining_shortfall -= withdrawal
                
                if remaining_shortfall <= 0:
                    break
    
    # 3. Then, withdraw from TFSAs (tax-free)
    if remaining_shortfall > 0:
        for account in active_accounts:
            if account.account_type == AccountType.TFSA:
                account_value = projected_accounts.get(year, {}).get(account.id, account.current_balance)
                withdrawal = min(account_value, remaining_shortfall)
                
                withdrawals[account.id] = withdrawals.get(account.id, 0) + withdrawal
                remaining_shortfall -= withdrawal
                
                if remaining_shortfall <= 0:
                    break
    
    # 4. Finally, withdraw from RRSP/RRIF beyond minimums (fully taxable)
    if remaining_shortfall > 0:
        for account in active_accounts:
            if account.account_type in [AccountType.RRSP, AccountType.RRIF]:
                account_value = projected_accounts.get(year, {}).get(account.id, account.current_balance)
                
                # For RRIFs, we've already withdrawn the minimum
                existing_withdrawal = withdrawals.get(account.id, 0)
                available = account_value - existing_withdrawal
                
                withdrawal = min(available, remaining_shortfall)
                
                withdrawals[account.id] = existing_withdrawal + withdrawal
                remaining_shortfall -= withdrawal
                
                if remaining_shortfall <= 0:
                    break
    
    # Calculate remaining balance after withdrawals
    remaining_balance = {}
    for account in active_accounts:
        account_value = projected_accounts.get(year, {}).get(account.id, account.current_balance)
        withdrawal = withdrawals.get(account.id, 0)
        remaining_balance[account.id] = max(0, account_value - withdrawal)
    
    return {
        "shortfall": shortfall,
        "withdrawals": withdrawals,
        "remaining_balance": remaining_balance,
        "unfunded_amount": max(0, remaining_shortfall)
    }


def calculate_death_benefit(
    family_member: FamilyMember,
    insurance_policies: List[InsurancePolicy],
    year: int
) -> float:
    """
    Calculate the death benefit that would be paid upon death of a family member.
    
    Args:
        family_member: The family member
        insurance_policies: List of insurance policies
        year: The year of death
    
    Returns:
        Total death benefit value
    """
    # Get policies where this person is the insured
    relevant_policies = [
        policy for policy in insurance_policies
        if policy.family_member_id == family_member.id
    ]
    
    total_benefit = 0
    current_date = date(year, 12, 31)
    
    for policy in relevant_policies:
        # Check if policy is active
        if ((policy.start_date is None or policy.start_date <= current_date) and
                (policy.end_date is None or policy.end_date >= current_date)):
            # For life insurance, add the coverage amount
            if policy.insurance_type == "LIFE":
                total_benefit += policy.coverage_amount
    
    return total_benefit 