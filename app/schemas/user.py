from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date


class UserBase(BaseModel):
    """Base user schema with common attributes."""
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None


class UserCreate(UserBase):
    """Schema for creating a new user, includes password."""
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    """Schema for updating user information."""
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    password: Optional[str] = Field(None, min_length=8)


class UserInDB(UserBase):
    """Schema for user information stored in the database (with hashed password)."""
    id: int
    is_active: bool
    hashed_password: str

    class Config:
        from_attributes = True


class User(UserBase):
    """Schema for user information returned to clients (no password)."""
    id: int
    is_active: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for JWT authentication token."""
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    """Schema for JWT token payload."""
    sub: Optional[int] = None 