from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.scenario import Scenario
from app.core.logging_config import get_logger

logger = get_logger("scenario_service")


def get_scenario_by_id(db: Session, scenario_id: int) -> Optional[Scenario]:
    """Get a scenario by its ID.
    
    Args:
        db: Database session
        scenario_id: ID of the scenario
        
    Returns:
        Scenario object if found, None otherwise
    """
    return db.query(Scenario).filter(Scenario.id == scenario_id).first()


def get_scenario_by_name(db: Session, name: str, user_id: int) -> Optional[Scenario]:
    """Get a scenario by its name for a specific user.
    
    Args:
        db: Database session
        name: Name of the scenario
        user_id: ID of the user
        
    Returns:
        Scenario object if found, None otherwise
    """
    return db.query(Scenario).filter(Scenario.name == name, Scenario.user_id == user_id).first()


def get_user_scenarios(db: Session, user_id: int) -> List[Scenario]:
    """Get all scenarios for a specific user.
    
    Args:
        db: Database session
        user_id: ID of the user
        
    Returns:
        List of Scenario objects
    """
    return db.query(Scenario).filter(Scenario.user_id == user_id).all()


def create_scenario(db: Session, name: str, description: str, user_id: int, is_default: bool = False) -> Scenario:
    """Create a new scenario.
    
    Args:
        db: Database session
        name: Name of the scenario
        description: Description of the scenario
        user_id: ID of the user
        is_default: Whether this is the default scenario
        
    Returns:
        Created Scenario object
    """
    scenario = Scenario(
        name=name,
        description=description,
        user_id=user_id,
        is_default=is_default
    )
    db.add(scenario)
    db.commit()
    db.refresh(scenario)
    logger.info(f"Created scenario: {scenario.name} for user: {user_id}")
    return scenario


def initialize_default_scenario(db: Session, user_id: int) -> Scenario:
    """Initialize the default 'Actual' scenario for a user if it doesn't exist.
    
    Args:
        db: Database session
        user_id: ID of the user
        
    Returns:
        Default Scenario object
    """
    # Check if the default scenario already exists
    default_scenario = get_scenario_by_name(db, "Actual", user_id)
    
    # If it doesn't exist, create it
    if not default_scenario:
        default_scenario = create_scenario(
            db=db,
            name="Actual",
            description="Default scenario representing actual financial data.",
            user_id=user_id,
            is_default=True
        )
        logger.info(f"Initialized default 'Actual' scenario for user: {user_id}")
    
    return default_scenario


def update_scenario(db: Session, scenario_id: int, name: str, description: str) -> Optional[Scenario]:
    """Update an existing scenario.
    
    Args:
        db: Database session
        scenario_id: ID of the scenario to update
        name: New name for the scenario
        description: New description for the scenario
        
    Returns:
        Updated Scenario object if found, None otherwise
    """
    scenario = get_scenario_by_id(db, scenario_id)
    if scenario:
        # Prevent updating the default "Actual" scenario name
        if scenario.is_default and name != "Actual":
            logger.warning(f"Attempted to rename default 'Actual' scenario to '{name}'")
            return None
            
        scenario.name = name
        scenario.description = description
        db.commit()
        db.refresh(scenario)
        logger.info(f"Updated scenario: {scenario.id}")
        return scenario
    return None


def delete_scenario(db: Session, scenario_id: int) -> bool:
    """Delete a scenario.
    
    Args:
        db: Database session
        scenario_id: ID of the scenario to delete
        
    Returns:
        True if the scenario was deleted, False otherwise
    """
    scenario = get_scenario_by_id(db, scenario_id)
    if scenario:
        # Prevent deleting the default "Actual" scenario
        if scenario.is_default:
            logger.warning(f"Attempted to delete default 'Actual' scenario")
            return False
            
        db.delete(scenario)
        db.commit()
        logger.info(f"Deleted scenario: {scenario_id}")
        return True
    return False 