# Import routers here for easier imports elsewhere
# This file intentionally left mostly empty 

from app.routers.auth import router as auth
from app.routers.family import router as family
# Will uncomment these as they're implemented:
from app.routers.investments import router as investments
from app.routers.assets import router as assets
from app.routers.income import router as income
from app.routers.expenses import router as expenses
from app.routers.insurance import router as insurance
from app.routers.projections import router as projections
from app.routers.scenarios import router as scenarios
from app.routers.entity_values import router as entity_values 