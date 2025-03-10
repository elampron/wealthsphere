# WealthSphere Development Guide

## Build & Run Commands
- **Backend**: `uvicorn app.main:app --reload` or `docker-compose up backend`
- **Frontend**: `npm run dev` or `docker-compose up frontend`
- **Full Stack**: `docker-compose up`
- **Lint Frontend**: `npm run lint`
- **Build Frontend**: `npm run build`
- **Run Tests**:
  - Backend: `pytest` or `pytest tests/test_file.py::test_function`
  - Frontend: `npm test` or `npm test -- -t "test name"`

## Code Style Guidelines
- **Backend (Python)**:
  - Use type hints with Pydantic models for validation
  - Follow PEP 8 spacing/indentation conventions
  - Use SQLAlchemy models for database interactions
  - Organize code in app/{models,schemas,routers,services}
  - Handle exceptions with appropriate HTTP status codes

- **Frontend (TypeScript/React)**:
  - Strict TypeScript typing
  - Use React hooks for state management
  - Follow Next.js file-based routing conventions
  - Leverage React Query for data fetching
  - Handle API errors gracefully with error boundaries
  - Use shadcn/ui components with consistent styling