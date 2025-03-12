from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db import get_db_session
from app.routers.auth import get_current_user
from app.models.user import User
from app.models.scenario import Scenario
from app.schemas.scenario import ScenarioCreate, ScenarioUpdate, Scenario as ScenarioSchema

router = APIRouter(
    prefix="/scenarios",
    tags=["scenarios"],
    dependencies=[Depends(get_current_user)]
)


@router.get("/", response_model=List[ScenarioSchema])
async def get_all_scenarios(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """
    Get all scenarios for the current user.
    """
    scenarios = db.query(Scenario).filter(Scenario.user_id == current_user.id).all()
    return scenarios


@router.get("/{scenario_id}", response_model=ScenarioSchema)
async def get_scenario(
    scenario_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """
    Get a single scenario by ID.
    """
    scenario = db.query(Scenario).filter(
        Scenario.id == scenario_id,
        Scenario.user_id == current_user.id
    ).first()
    
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scenario not found"
        )
    
    return scenario


@router.post("/", response_model=ScenarioSchema, status_code=status.HTTP_201_CREATED)
async def create_scenario(
    scenario_data: ScenarioCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """
    Create a new scenario.
    """
    try:
        new_scenario = Scenario(
            name=scenario_data.name,
            description=scenario_data.description,
            user_id=current_user.id,
            is_default=False,
            is_locked=False
        )
        
        db.add(new_scenario)
        db.commit()
        db.refresh(new_scenario)
        return new_scenario
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A scenario with this name already exists"
        )


@router.put("/{scenario_id}", response_model=ScenarioSchema)
async def update_scenario(
    scenario_id: int,
    scenario_data: ScenarioUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """
    Update a scenario.
    """
    scenario = db.query(Scenario).filter(
        Scenario.id == scenario_id,
        Scenario.user_id == current_user.id
    ).first()
    
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scenario not found"
        )
    
    if scenario.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update a locked scenario"
        )
    
    try:
        # Update only the provided fields
        if scenario_data.name is not None:
            scenario.name = scenario_data.name
        if scenario_data.description is not None:
            scenario.description = scenario_data.description
        
        db.commit()
        db.refresh(scenario)
        return scenario
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A scenario with this name already exists"
        )


@router.delete("/{scenario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scenario(
    scenario_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """
    Delete a scenario.
    """
    scenario = db.query(Scenario).filter(
        Scenario.id == scenario_id,
        Scenario.user_id == current_user.id
    ).first()
    
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scenario not found"
        )
    
    if scenario.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete a locked scenario"
        )
    
    db.delete(scenario)
    db.commit()
    return None 