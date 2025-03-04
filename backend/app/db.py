from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger("db")

# Create SQLAlchemy engine
engine = create_engine(
    settings.DATABASE_URL, 
    echo=settings.DEBUG,
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
)

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a base class for declarative models
Base = declarative_base()


# Dependency for FastAPI routes to get database session
def get_db_session() -> Session:
    """Get a database session.
    
    Yields:
        SQLAlchemy Session
    """
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        logger.error(f"Database session error: {str(e)}")
        raise
    finally:
        session.close()


def init_db() -> None:
    """Initialize the database with all tables."""
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized.") 