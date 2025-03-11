from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging_config import setup_logging
from app.db import init_db, get_db_session

# Import routers
from app.routers import auth, family
# Will uncomment these as they're implemented:
from app.routers import investments, assets, income, expenses, insurance, projections, scenarios

# Import services
from app.services import scenario as scenario_service

# Set up logging
setup_logging()

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description=f"{settings.APP_NAME} API - A wealth management application for Canadian financial planning",
    version="0.1.0",
)

# Configure CORS
origins = [
    "http://localhost",
    "http://localhost:3000",  # React default
    "http://localhost:8080",  # Vue default
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root endpoint
@app.get("/")
async def root():
    return {"message": f"Welcome to the {settings.APP_NAME} API"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}


# Event handlers
@app.on_event("startup")
def on_startup():
    # Initialize the database tables
    init_db()


# Include routers
app.include_router(auth, prefix=settings.API_PREFIX, tags=["auth"])
app.include_router(family, prefix=settings.API_PREFIX, tags=["family"])
# Will uncomment these as they're implemented:
app.include_router(investments, prefix=settings.API_PREFIX, tags=["investments"])
app.include_router(assets, prefix=settings.API_PREFIX, tags=["assets"])
app.include_router(income, prefix=settings.API_PREFIX, tags=["income"])
app.include_router(expenses, prefix=settings.API_PREFIX, tags=["expenses"])
app.include_router(insurance, prefix=settings.API_PREFIX, tags=["insurance"])
app.include_router(projections, prefix=settings.API_PREFIX, tags=["projections"])
app.include_router(scenarios, prefix=settings.API_PREFIX, tags=["scenarios"])

# Add a health check endpoint
@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}

# Add a development setup endpoint to create a test user if needed
@app.get("/api/dev-setup", tags=["Development"])
async def dev_setup(db=Depends(get_db_session)):
    """
    Development-only endpoint to set up test data.
    This should be disabled in production.
    """
    if settings.DEBUG:
        from app.models.user import User
        from app.core.security import get_password_hash
        
        # Check if test user exists
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        
        if not test_user:
            # Create a test user
            test_user = User(
                email="test@example.com",
                hashed_password=get_password_hash("password123"),
                first_name="Test",
                last_name="User",
                is_active=True
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
        
        # Create default "Actual" scenario for the test user
        default_scenario = scenario_service.initialize_default_scenario(db, test_user.id)
            
        return {"message": "Development setup completed successfully", "test_user": test_user.email, "default_scenario": default_scenario.name}
    
    return {"message": "Development mode is disabled"} 