from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base


class EntityValue(Base):
    __tablename__ = "entity_values"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=False)
    scenario_id = Column(Integer, ForeignKey("scenarios.id"), nullable=False)
    recorded_at = Column(DateTime, nullable=False)
    value = Column(Float, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    scenario = relationship("Scenario", back_populates="entity_values") 