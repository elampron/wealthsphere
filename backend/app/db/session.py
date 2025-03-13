from typing import Generator
from sqlalchemy.orm import Session
from app.db.database import SessionLocal

def get_db() -> Generator[Session, None, None]:
    """
    Dependency function to get a database session.
    Yields a database session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 