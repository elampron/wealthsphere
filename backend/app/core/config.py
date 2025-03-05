from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings using Pydantic for environment variable validation and parsing."""
    
    # Application settings
    APP_NAME: str = "WealthSphere"
    API_PREFIX: str = "/api"
    DEBUG: bool = False
    
    # Database settings
    DATABASE_URL: str = "sqlite:///./wealthsphere.db"
    
    # JWT Authentication
    SECRET_KEY: str = "CHANGE_THIS_TO_A_STRONG_SECRET_KEY_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200  # 30 days for development
    
    # Default user for testing/development (if needed)
    FIRST_USER_EMAIL: Optional[str] = None
    FIRST_USER_PASSWORD: Optional[str] = None
    
    # Canadian specific settings
    TAX_YEAR: int = 2023
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Create a settings instance for use throughout the application
settings = Settings() 