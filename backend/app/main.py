from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging_config import setup_logging
from app.db import init_db, get_db_session

# Import routers
from app.routers import auth, family
# Will uncomment these as they're implemented:
from app.routers import investments, assets, income, expenses, insurance, projections

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