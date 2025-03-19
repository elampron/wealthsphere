from typing import Optional, List, Dict, Union, Any
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc

from app.models import (
    ValueRecord,
    EntityType,
    Scenario,
    Asset,
    InvestmentAccount,
    IncomeSource,
    Expense,
)


def get_actual_scenario(db: Session) -> Scenario:
    """
    Get the default 'Actual' scenario or create it if it doesn't exist.
    
    Args:
        db: Database session
        
    Returns:
        The Actual scenario
    """
    actual_scenario = db.query(Scenario).filter(Scenario.is_default == True).first()
    
    if not actual_scenario:
        # Create the default Actual scenario if it doesn't exist
        actual_scenario = Scenario(
            name="Actual",
            description="The real/historical values (locked scenario)",
            is_default=True,
            is_locked=True,
            user_id=1  # Default admin user, adjust as needed
        )
        db.add(actual_scenario)
        db.commit()
        db.refresh(actual_scenario)
    
    return actual_scenario


def get_latest_value_record(
    db: Session,
    entity_type: EntityType,
    entity_id: int,
    scenario_id: Optional[int] = None
) -> Optional[ValueRecord]:
    """
    Get the most recent value record for a given entity and scenario.
    
    Args:
        db: Database session
        entity_type: Type of the entity (asset, income_source, etc.)
        entity_id: ID of the entity
        scenario_id: ID of the scenario (if None, uses the default 'Actual' scenario)
        
    Returns:
        The most recent ValueRecord or None if not found
    """
    if scenario_id is None:
        scenario = get_actual_scenario(db)
        scenario_id = scenario.id
    
    # Query for the most recent value record
    value_record = (
        db.query(ValueRecord)
        .filter(
            ValueRecord.entity_type == entity_type,
            ValueRecord.entity_id == entity_id,
            ValueRecord.scenario_id == scenario_id
        )
        .order_by(desc(ValueRecord.value_date))
        .first()
    )
    
    return value_record


def create_or_update_value_record(
    db: Session,
    entity_type: EntityType,
    entity_id: int,
    value_amount: float,
    value_date: date,
    scenario_id: Optional[int] = None
) -> ValueRecord:
    """
    Create a new value record or update an existing one for the same date.
    
    Args:
        db: Database session
        entity_type: Type of the entity
        entity_id: ID of the entity 
        value_amount: The monetary value
        value_date: The date this value is effective
        scenario_id: ID of the scenario (if None, uses the default 'Actual' scenario)
        
    Returns:
        The created or updated ValueRecord
    """
    if scenario_id is None:
        scenario = get_actual_scenario(db)
        scenario_id = scenario.id
    
    # Check if a record already exists for this entity+scenario+date
    existing_record = (
        db.query(ValueRecord)
        .filter(
            ValueRecord.entity_type == entity_type,
            ValueRecord.entity_id == entity_id,
            ValueRecord.scenario_id == scenario_id,
            ValueRecord.value_date == value_date
        )
        .first()
    )
    
    if existing_record:
        # Update the existing record
        existing_record.value_amount = value_amount
        db.commit()
        db.refresh(existing_record)
        return existing_record
    else:
        # Create a new record
        new_record = ValueRecord(
            entity_type=entity_type,
            entity_id=entity_id,
            scenario_id=scenario_id,
            value_date=value_date,
            value_amount=value_amount
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        return new_record


def create_or_update_entity_with_actual_value(
    db: Session,
    entity_data: Dict[str, Any],
    entity_type: EntityType,
    actual_value: float,
    actual_value_date: date
) -> Union[Asset, InvestmentAccount, IncomeSource, Expense]:
    """
    Create a new entity or update an existing one along with its actual value.
    
    Args:
        db: Database session
        entity_data: Dictionary containing the entity's data
        entity_type: Type of the entity
        actual_value: The actual monetary value
        actual_value_date: The effective date of the actual value
        
    Returns:
        The created or updated entity
    """
    # Handle entity creation based on type
    entity_id = entity_data.get('id')
    entity = None
    
    if entity_type == EntityType.ASSET:
        if entity_id:
            entity = db.query(Asset).filter(Asset.id == entity_id).first()
            if entity:
                for key, value in entity_data.items():
                    if key != 'id' and hasattr(entity, key):
                        setattr(entity, key, value)
        else:
            entity = Asset(**entity_data)
            db.add(entity)
        
    elif entity_type == EntityType.INVESTMENT_ACCOUNT:
        if entity_id:
            entity = db.query(InvestmentAccount).filter(InvestmentAccount.id == entity_id).first()
            if entity:
                for key, value in entity_data.items():
                    if key != 'id' and hasattr(entity, key):
                        setattr(entity, key, value)
        else:
            entity = InvestmentAccount(**entity_data)
            db.add(entity)
            
    elif entity_type == EntityType.INCOME_SOURCE:
        if entity_id:
            entity = db.query(IncomeSource).filter(IncomeSource.id == entity_id).first()
            if entity:
                for key, value in entity_data.items():
                    if key != 'id' and hasattr(entity, key):
                        setattr(entity, key, value)
        else:
            entity = IncomeSource(**entity_data)
            db.add(entity)
            
    elif entity_type == EntityType.EXPENSE:
        if entity_id:
            entity = db.query(Expense).filter(Expense.id == entity_id).first()
            if entity:
                for key, value in entity_data.items():
                    if key != 'id' and hasattr(entity, key):
                        setattr(entity, key, value)
        else:
            entity = Expense(**entity_data)
            db.add(entity)
    
    # Save the entity to get its ID
    db.commit()
    db.refresh(entity)
    
    # Create or update the actual value record
    scenario = get_actual_scenario(db)
    create_or_update_value_record(
        db=db,
        entity_type=entity_type,
        entity_id=entity.id,
        value_amount=actual_value,
        value_date=actual_value_date,
        scenario_id=scenario.id
    )
    
    return entity


def get_entity_with_actual_value(
    db: Session,
    entity_type: EntityType,
    entity_id: int
) -> Dict[str, Any]:
    """
    Get an entity along with its latest actual value.
    
    Args:
        db: Database session
        entity_type: Type of the entity
        entity_id: ID of the entity
        
    Returns:
        Dictionary containing the entity data and its actual value
    """
    entity = None
    
    if entity_type == EntityType.ASSET:
        entity = db.query(Asset).filter(Asset.id == entity_id).first()
    elif entity_type == EntityType.INVESTMENT_ACCOUNT:
        entity = db.query(InvestmentAccount).filter(InvestmentAccount.id == entity_id).first()
    elif entity_type == EntityType.INCOME_SOURCE:
        entity = db.query(IncomeSource).filter(IncomeSource.id == entity_id).first()
    elif entity_type == EntityType.EXPENSE:
        entity = db.query(Expense).filter(Expense.id == entity_id).first()
    
    if not entity:
        return None
    
    # Get the latest actual value
    scenario = get_actual_scenario(db)
    value_record = get_latest_value_record(
        db=db,
        entity_type=entity_type,
        entity_id=entity_id,
        scenario_id=scenario.id
    )
    
    # Create a dictionary with entity data
    entity_dict = {column.name: getattr(entity, column.name) 
                  for column in entity.__table__.columns}
    
    # Add actual value information if it exists
    if value_record:
        entity_dict.update({
            "actual_value": value_record.value_amount,
            "actual_value_date": value_record.value_date
        })
    else:
        entity_dict.update({
            "actual_value": None,
            "actual_value_date": None
        })
    
    return entity_dict 