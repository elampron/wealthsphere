from sqlalchemy.orm import Session
from app.models.scenario import Scenario

def ensure_default_scenario(db: Session, user_id: int) -> Scenario:
    """
    Ensure the default 'Actual' scenario exists for the user.
    If it doesn't exist, create it.
    
    Args:
        db: SQLAlchemy database session
        user_id: ID of the user to create the default scenario for
        
    Returns:
        The default scenario instance
    """
    # Check if the default scenario already exists for this user
    default_scenario = db.query(Scenario).filter(
        Scenario.user_id == user_id,
        Scenario.is_default == True
    ).first()
    
    # If default scenario doesn't exist, create it
    if not default_scenario:
        default_scenario = Scenario(
            name="Actual",
            description="Default scenario representing actual financial data",
            user_id=user_id,
            is_default=True,
            is_locked=True  # The default scenario is locked and cannot be deleted or renamed
        )
        db.add(default_scenario)
        db.commit()
        db.refresh(default_scenario)
    
    return default_scenario 