from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db import get_db_session
from app.models import Expense
from app.schemas import ExpenseCreate, Expense as ExpenseRead, ExpenseUpdate, ExpenseCopyRequest
from app.routers.auth import get_current_user
from app.schemas import User


router = APIRouter()


@router.post("/expenses", response_model=ExpenseRead)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new expense."""
    try:
        # Create the expense with the provided data
        expense = Expense(
            user_id=current_user.id,
            name=payload.name,
            expense_type=payload.expense_type,  # Already mapped in the frontend
            amount=payload.amount,
            category=payload.category,  # Added category field
            start_year=payload.start_year,
            end_year=payload.end_year,
            expected_growth_rate=payload.expected_growth_rate,
            is_tax_deductible=payload.is_tax_deductible,
            notes=payload.notes,
            family_member_id=payload.family_member_id
        )
        db.add(expense)
        db.commit()
        db.refresh(expense)
        return expense
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating expense: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating expense: {str(e)}"
        )


@router.get("/expenses", response_model=List[ExpenseRead])
def list_expenses(
    family_member_id: Optional[int] = None,
    expense_type: Optional[str] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get all expenses, with optional filters."""
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    
    if family_member_id:
        query = query.filter(Expense.family_member_id == family_member_id)
    
    if expense_type:
        query = query.filter(Expense.expense_type == expense_type)
    
    if year:
        # Filter expenses that are active in the given year (start_year <= year and (end_year is None or end_year >= year))
        query = query.filter(Expense.start_year <= year)
        query = query.filter((Expense.end_year.is_(None)) | (Expense.end_year >= year))
    
    return query.all()


@router.get("/expenses/{expense_id}", response_model=ExpenseRead)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific expense by ID."""
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    return expense


@router.put("/expenses/{expense_id}", response_model=ExpenseRead)
def update_expense(
    expense_id: int,
    payload: ExpenseUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Update an expense."""
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    # Update fields
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(expense, field, value)
    
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Delete an expense."""
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    db.delete(expense)
    db.commit()
    return None


@router.post("/expenses/{expense_id}/copy", response_model=List[ExpenseRead])
def copy_expense_to_years(
    expense_id: int,
    payload: ExpenseCopyRequest,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Copy an expense to multiple years."""
    source_expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    
    if not source_expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source expense not found"
        )
    
    new_expenses = []
    for year in payload.target_years:
        # Ensure we're not creating a duplicate for the existing expense's year
        if source_expense.start_year == year:
            continue
            
        # Create a new expense for each target year
        new_expense = Expense(
            user_id=current_user.id,
            name=source_expense.name,
            expense_type=source_expense.expense_type,
            amount=payload.adjust_amount if payload.adjust_amount is not None else source_expense.amount,
            start_year=year,
            end_year=payload.end_year,
            expected_growth_rate=source_expense.expected_growth_rate,
            is_tax_deductible=source_expense.is_tax_deductible,
            notes=source_expense.notes,
            family_member_id=source_expense.family_member_id
        )
        db.add(new_expense)
        new_expenses.append(new_expense)
    
    db.commit()
    
    # Refresh all new expenses
    for expense in new_expenses:
        db.refresh(expense)
    
    return new_expenses 