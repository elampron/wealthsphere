from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

from app.db import Base


class Scenario(Base):
    """Scenario model for financial projections and planning."""
    __tablename__ = "scenarios"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Scenario-specific assumptions
    inflation_rate = Column(Float, nullable=False, default=0.02)  # Annual inflation rate as decimal
    investment_return_rate = Column(Float, nullable=False, default=0.06)  # Default investment return rate
    real_estate_appreciation_rate = Column(Float, nullable=False, default=0.03)  # Default real estate appreciation rate

    # Relationships
    user = relationship("User", back_populates="scenarios")
    entity_values = relationship("EntityValue", back_populates="scenario")
    
    def __repr__(self):
        return f"<Scenario {self.name} (User: {self.user_id})>" 