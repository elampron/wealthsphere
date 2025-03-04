# WealthSphere

A personal wealth management application for Canadian financial planning. WealthSphere helps individuals and families track investments, income sources, expenses, and insurance policies to provide comprehensive financial projections and tax-efficient planning.

## Features

- **Family Wealth Planning**: Track multiple family members with individual financial profiles
- **Investment Portfolios**: Support for RRSP, TFSA, Non-Registered, and other account types
- **Financial Projections**: Annual net worth and cash flow projections
- **Tax Optimization**: Determine the most tax-efficient withdrawal strategies
- **Life Insurance Planning**: Track life insurance policies and integrate death benefits into projections
- **Canadian Compliance**: Built with Canadian tax laws and financial products in mind

## Technology Stack

- **Backend**: Python with FastAPI
- **Database**: SQLite (development), PostgreSQL (production recommended)
- **API Documentation**: Swagger UI (built-in with FastAPI)
- **Authentication**: JWT-based authentication
- **Validation**: Pydantic for data validation

## Getting Started

### Prerequisites

- Python 3.10+
- pip or Poetry for package management

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/wealthsphere.git
   cd wealthsphere
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

5. Run the application:
   ```bash
   uvicorn app.main:app --reload
   ```

6. Access the API documentation at `http://localhost:8000/docs`

## Project Structure

```
wealthsphere/
├── app/
│   ├── core/           # Core configurations
│   ├── models/         # Database models
│   ├── schemas/        # Pydantic schemas for validation
│   ├── services/       # Business logic
│   ├── routers/        # API endpoints
│   ├── main.py         # FastAPI application
│   └── db.py           # Database initialization
├── tests/              # Test suite
├── requirements.txt    # Dependencies
├── .env.example        # Example environment variables
└── README.md           # Project documentation
```

## Development

### Running Tests

```bash
pytest
```

### Database Migrations

We use SQLAlchemy models directly for simplicity. When you change models, the database will be recreated when the application starts in development mode.

For production, it's recommended to use Alembic for proper migrations.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all the contributors of the FastAPI framework
- Inspired by the need for better financial planning tools for Canadians