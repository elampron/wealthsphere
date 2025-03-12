# WealthSphere Frontend

This is the frontend for the WealthSphere application, built with Next.js 14.

## Project Structure

The project follows Next.js 14 best practices with a clean, organized structure:

```
frontend/
├── public/                   # Static assets (images, fonts, etc.)
├── src/                      # Main source folder
│   ├── app/                  # App Router folder for routes and layouts
│   │   ├── (auth)/           # Authentication routes (login, signup)
│   │   ├── accounts/         # Accounts route
│   │   ├── assets/           # Assets route
│   │   ├── expenses/         # Expenses route
│   │   ├── family/           # Family route
│   │   ├── income/           # Income route
│   │   ├── insurance/        # Insurance route
│   │   ├── projections/      # Projections route
│   │   ├── layout.tsx        # Global layout wrapper
│   │   └── page.tsx          # Home page
│   ├── components/           # Reusable UI components
│   │   ├── common/           # Shared components (Header, Footer, etc.)
│   │   ├── feature/          # Feature-specific components
│   │   │   ├── dashboard/    # Dashboard components
│   │   │   └── forms/        # Form components
│   │   └── ui/               # UI components library
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Library code, utilities
│   │   ├── api/              # API-related code
│   │   ├── context/          # React context providers
│   │   └── utils/            # Utility functions
│   ├── styles/               # Global styles and CSS modules
│   └── middleware.ts         # Next.js middleware for auth protection
├── .env                      # Environment variables
├── .env.local                # Local environment variables
├── next.config.mjs           # Next.js configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Package manifest
```

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Run the development server:
   ```
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

To build the application for production:

```
npm run build
```

## Docker

This project can be built and run using Docker:

```
docker build -t wealthsphere-frontend .
docker run -p 3000:3000 wealthsphere-frontend
```

## Features

- Financial dashboard with net worth tracking
- Investment account management (RRSP, TFSA, Non-Registered)
- Family member financial profiles
- Expense tracking
- Financial projections and planning

## Technology Stack

- **Framework:** Next.js with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **State Management:** React Query (TanStack Query)
- **HTTP Client:** Native fetch with custom wrapper

## Connecting to the Backend

The frontend is designed to work with the FastAPI backend. By default, it connects to `http://localhost:8000`, but you can change this in `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Development

### Adding new shadcn components

```bash
npx shadcn add [component-name]
```

### Creating a new page

1. Create a new directory in `app/`
2. Add a `page.tsx` file with your component

## License

[License details]
