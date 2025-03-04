import logging
import sys
from typing import Any, Dict, List

from app.core.config import settings


def setup_logging() -> None:
    """Configure logging settings for the application."""
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Configure root logger
    logging.basicConfig(
        level=logging.INFO if settings.DEBUG else logging.WARNING,
        format=log_format,
        handlers=[logging.StreamHandler(sys.stdout)]
    )
    
    # Set level for specific loggers
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("fastapi").setLevel(logging.INFO)
    
    # Our application logger
    logger = logging.getLogger("wealthsphere")
    logger.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)
    
    # You could add file handlers here if needed
    # file_handler = logging.FileHandler("logs/app.log")
    # file_handler.setFormatter(logging.Formatter(log_format))
    # logger.addHandler(file_handler)


# Get a pre-configured logger for use throughout the application
def get_logger(name: str) -> logging.Logger:
    """Get a logger with the specified name.
    
    Args:
        name: The name for the logger (typically the module name)
        
    Returns:
        A configured logger instance
    """
    return logging.getLogger(f"wealthsphere.{name}") 