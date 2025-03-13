from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    """Base schema class with common configuration and fields."""
    
    model_config = ConfigDict(
        from_attributes=True,  # Allow ORM model -> Pydantic model conversion
        json_encoders={
            datetime: lambda dt: dt.isoformat()  # ISO format for datetime fields
        },
        json_schema_extra={
            "example": {
                "id": 1,
                "created_at": "2024-03-13T00:00:00",
                "updated_at": "2024-03-13T00:00:00"
            }
        }
    )
    
    id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None 