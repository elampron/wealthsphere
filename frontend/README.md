# WealthSphere Frontend

This is the frontend for WealthSphere, a personal wealth management application for Canadian users. It's built with Next.js, TypeScript, and shadcn/ui (which uses Tailwind CSS).

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

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/wealthsphere.git
cd wealthsphere/frontend
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```
Then edit `.env.local` to include your backend API URL.

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
frontend/
├── app/                # Next.js app router pages
│   ├── layout.tsx      # Root layout with providers
│   ├── page.tsx        # Dashboard page
│   ├── accounts/       # Account management
│   └── family/         # Family member management
├── components/         # React components
│   ├── ui/             # shadcn UI components
│   ├── forms/          # Form components
│   ├── layout/         # Layout components (Header, Footer)
│   └── dashboard/      # Dashboard-specific components
├── lib/                # Utility libraries
│   ├── api/            # API integration
│   └── providers.tsx   # React providers (React Query)
├── hooks/              # Custom React hooks
├── public/             # Static assets
└── README.md           # This file
```

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
