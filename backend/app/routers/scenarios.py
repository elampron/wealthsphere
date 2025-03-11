from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db import get_db_session
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.scenario import Scenario, ScenarioCreate, ScenarioUpdate
from app.services import scenario as scenario_service
from app.core.logging_config import get_logger

logger = get_logger("scenarios_router")

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


@router.get("/", response_model=List[Scenario])
def get_scenarios(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Get all scenarios for the current user."""
    scenarios = scenario_service.get_user_scenarios(db, current_user.id)
    return scenarios


@router.post("/", response_model=Scenario)
def create_scenario(
    scenario_in: ScenarioCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Create a new scenario."""
    # Check if a scenario with the same name already exists
    existing_scenario = scenario_service.get_scenario_by_name(db, scenario_in.name, current_user.id)
    if existing_scenario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Scenario with name '{scenario_in.name}' already exists"
        )
    
    # Create the new scenario
    scenario = scenario_service.create_scenario(
        db, 
        name=scenario_in.name,
        description=scenario_in.description,
        user_id=current_user.id
    )
    
    return scenario


@router.get("/{scenario_id}", response_model=Scenario)
def get_scenario(
    scenario_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Get a scenario by ID."""
    scenario = scenario_service.get_scenario_by_id(db, scenario_id)
    
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario with ID {scenario_id} not found"
        )
    
    # Ensure the scenario belongs to the current user
    if scenario.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this scenario"
        )
    
    return scenario


@router.put("/{scenario_id}", response_model=Scenario)
def update_scenario(
    scenario_id: int,
    scenario_in: ScenarioUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Update a scenario."""
    scenario = scenario_service.get_scenario_by_id(db, scenario_id)
    
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario with ID {scenario_id} not found"
        )
    
    # Ensure the scenario belongs to the current user
    if scenario.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this scenario"
        )
    
    # If trying to update to a new name, check that name doesn't exist
    if scenario_in.name and scenario_in.name != scenario.name:
        existing_scenario = scenario_service.get_scenario_by_name(db, scenario_in.name, current_user.id)
        if existing_scenario:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Scenario with name '{scenario_in.name}' already exists"
            )
    
    # Update the scenario
    name = scenario_in.name if scenario_in.name is not None else scenario.name
    description = scenario_in.description if scenario_in.description is not None else scenario.description
    
    updated_scenario = scenario_service.update_scenario(db, scenario_id, name, description)
    
    if not updated_scenario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update scenario. The 'Actual' scenario cannot be renamed."
        )
    
    return updated_scenario


@router.delete("/{scenario_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scenario(
    scenario_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Delete a scenario."""
    scenario = scenario_service.get_scenario_by_id(db, scenario_id)
    
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario with ID {scenario_id} not found"
        )
    
    # Ensure the scenario belongs to the current user
    if scenario.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this scenario"
        )
    
    # Delete the scenario
    deleted = scenario_service.delete_scenario(db, scenario_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not delete scenario. The 'Actual' scenario cannot be deleted."
        )
    
    return None 