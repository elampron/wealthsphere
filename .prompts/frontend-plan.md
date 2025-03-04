Below is a step-by-step development plan for the **frontend** of Wealthsphere, using **Next.js** and **shadcn** (shadcn/UI library with Tailwind). It outlines folder structure, recommended tooling, and best practices for building a clean, scalable interface that pairs well with the FastAPI backend.

---

## 1. High-Level Architecture

1. **Tech Stack**  
   - **Framework:** Next.js (latest version, ideally with TypeScript)  
   - **UI Library:** [shadcn/ui](https://ui.shadcn.com/) (built on Tailwind CSS)  
   - **Styling:** Tailwind CSS (config included by shadcn)  
   - **State Management/Data Fetching:** React Query (TanStack Query) or a simple Context/Reducer approach  
   - **Authentication (Optional):** NextAuth.js if you want a standard OIDC/credentials-based solution  
   - **Testing:** Jest + React Testing Library  

2. **General Approach**  
   - **Component-Driven**: Build modular UI components using shadcn’s pre-styled components, customizing them to match Wealthsphere’s branding.  
   - **API Integration**: Use either built-in Next.js server routes (for SSR) or direct client calls to the FastAPI endpoints. For complex state, prefer something like React Query to handle caching, retries, and synchronization.  

---

## 2. Project Structure

A suggested structure for a Next.js TypeScript project might look like this:

```
wealthsphere-frontend/
├── app/
│   ├── layout.tsx        # Root layout (Header, Footer)
│   ├── page.tsx          # Home or Dashboard page
│   ├── (auth)/login      # Example route for login if needed
│   └── ...               # Other Next.js routes
├── components/
│   ├── ui/               # Shadcn UI components (custom or overrides)
│   ├── forms/            # Reusable form components
│   ├── layout/           # NavBar, SideBar, Footer, etc.
│   └── ...
├── lib/
│   ├── api.ts            # API clients or fetch wrappers
│   ├── auth.ts           # Auth logic, tokens, etc. (if not using NextAuth)
│   └── ...
├── hooks/
│   ├── useUser.ts        # Example React Query hooks for user data
│   └── ...
├── styles/
│   ├── globals.css       # Tailwind base styles, custom overrides
│   └── tailwind.css      # Tailwind imports
├── public/               # Static assets (images, etc.)
├── tests/
│   ├── components/
│   └── pages/
├── .env.example
├── tailwind.config.js
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

> Note: If you use shadcn’s CLI approach, you might see a slightly different structure, but the core idea remains the same.

---

## 3. Setup & Configuration

1. **Initialize Next.js Project**  
   ```bash
   npx create-next-app@latest wealthsphere-frontend --typescript
   ```
   Or if you prefer the [app router](https://nextjs.org/docs/app), enable it by default.

2. **Install Dependencies**  
   - **Tailwind + shadcn**: Follow instructions at [shadcn/ui](https://ui.shadcn.com/) to install Tailwind and add the library.  
   - **React Query (TanStack)** for data fetching:
     ```bash
     npm install @tanstack/react-query
     ```
   - **Additional**: axios or fetch wrappers, date libraries (e.g., dayjs), etc.  

3. **Tailwind & shadcn Setup**  
   - Make sure your `tailwind.config.js` includes the correct content paths and shadcn config:
     ```js
     module.exports = {
       content: [
         "./app/**/*.{ts,tsx}",
         "./components/**/*.{ts,tsx}",
         "./pages/**/*.{ts,tsx}",
         "./node_modules/@shadcn/ui/dist/**/*.{ts,tsx}"
       ],
       theme: {
         extend: {},
       },
       plugins: [],
     };
     ```
   - Import Tailwind in `globals.css` or `styles/tailwind.css`.

4. **Environment Variables**  
   - `.env.local` for local dev (e.g., `NEXT_PUBLIC_API_URL=http://localhost:8000`).  
   - Use `NEXT_PUBLIC_` prefix in Next.js so variables are available on the client side.

---

## 4. Integrating with the FastAPI Backend

1. **API Wrapper**  
   - Create a simple fetch or axios-based utility in `lib/api.ts` or `lib/http.ts`.
   - Example:
     ```ts
     import axios from 'axios';

     const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

     export const api = axios.create({
       baseURL,
       // optional: headers, interceptors, etc.
     });
     ```
2. **Data Fetching & Caching**  
   - Wrap your application in a `ReactQuery` provider in `layout.tsx` or `_app.tsx` (depending on the router):
     ```tsx
     // app/layout.tsx
     import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

     const queryClient = new QueryClient();

     export default function RootLayout({ children }: { children: React.ReactNode }) {
       return (
         <html lang="en">
           <body>
             <QueryClientProvider client={queryClient}>
               {children}
             </QueryClientProvider>
           </body>
         </html>
       );
     }
     ```
   - Then create custom hooks in `hooks/` (e.g., `useInvestmentAccounts.ts`) that call the backend endpoints, using `react-query`:

     ```ts
     import { useQuery } from "@tanstack/react-query";
     import { api } from "../lib/api";

     export function useInvestmentAccounts() {
       return useQuery(["investment-accounts"], async () => {
         const { data } = await api.get("/investment-accounts");
         return data;
       });
     }
     ```

3. **Authentication**  
   - If using JWT from the FastAPI side, store it in an HTTP-only cookie or local storage.  
   - Alternatively, use NextAuth.js with your own custom provider.  
   - Provide a “login” function that calls `/auth/token` from the backend, then sets the token.  

---

## 5. UI Components with shadcn

1. **shadcn/ui**  
   - The library provides a curated set of Tailwind-based components. Run the shadcn CLI to scaffold them:
     ```bash
     npx shadcn-ui init
     ```
   - This creates a `components/ui/` folder with base components.  
   - Example usage:

     ```tsx
     import { Button } from "@/components/ui/button"

     export default function SomePage() {
       return <Button variant="default">Click Me</Button>
     }
     ```

2. **Styling & Customization**  
   - Override Tailwind config to match your brand colors, typography.  
   - You can easily customize the existing shadcn components or create your own wrappers.

3. **Atomic / Component-Driven Approach**  
   - Keep components small and reusable. For instance, a `<NetWorthChart />` component in `components/charts/`.  
   - For forms, utilize shadcn form components or integrate something like React Hook Form for streamlined validation.

---

## 6. Page & Navigation Structure

1. **Dashboard**  
   - A main dashboard page that shows a high-level overview: net worth, cash flow summary, big charts.  
   - Possibly place this in `app/dashboard/page.tsx`.

2. **Financial Entities**  
   - A page for “Accounts” listing RRSP, TFSA, Non-registered, etc.  
   - Another page for “Insurance” or “Family” to handle family member data.  
   - Keep the routes meaningful and user-friendly.

3. **User Flows**  
   - **Data Entry**: wizards or step-by-step forms to input finances, assets, etc.  
   - **Scenario Analysis**: a page to compare “what-if” scenarios with interactive charts.

---

## 7. Testing

1. **Setup Jest & React Testing Library**  
   - Next.js typically has recommended testing patterns.  
   - Sample config in `jest.config.js`:
     ```js
     module.exports = {
       testEnvironment: "jsdom",
       setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
       moduleNameMapper: {
         "\\.(css|less|scss|sass)$": "identity-obj-proxy"
       }
     };
     ```
2. **Unit Tests**  
   - Test each component in `tests/components/` with relevant props.  
   - Example:

     ```tsx
     // tests/components/Button.test.tsx
     import { render, screen } from "@testing-library/react";
     import { Button } from "@/components/ui/button";

     test("renders button with text", () => {
       render(<Button>Click Me</Button>);
       expect(screen.getByText("Click Me")).toBeInTheDocument();
     });
     ```

3. **Integration Tests**  
   - Test entire pages or flows (e.g., fill out a form, check data is displayed).  
   - Use [MSW (Mock Service Worker)](https://mswjs.io/) to mock backend calls.  

---

## 8. Production Build & Deployment

1. **Build Command**  
   - `npm run build` → compiles Next.js.  
   - `npm run start` → runs the production server.

2. **Docker**  
   - Optional, but you might unify the entire deployment. A minimal `Dockerfile`:
     ```dockerfile
     FROM node:18-alpine

     WORKDIR /app
     COPY package*.json ./
     RUN npm install
     COPY . .
     RUN npm run build

     EXPOSE 3000
     CMD ["npm", "run", "start"]
     ```

3. **Hosting**  
   - You can host Next.js on Vercel, AWS, or any Docker-friendly platform.  
   - Make sure environment variables (like `NEXT_PUBLIC_API_URL`) are set properly in production.

---

## 9. Development Roadmap (Phases)

1. **Phase 1**  
   - Initialize Next.js + TypeScript project.  
   - Integrate Tailwind + shadcn UI.  
   - Set up basic routing (home page, login page, dashboard scaffold).

2. **Phase 2**  
   - Implement core pages: “Accounts,” “Expenses,” “Family Members,” etc.  
   - Hook up data fetching with React Query to the FastAPI endpoints.  
   - Basic charts for net worth & cash flow.

3. **Phase 3**  
   - Advanced features (scenario planning, “what-if” pages, dynamic charts).  
   - Deeper integration with authentication (if needed).  
   - Ensure robust test coverage (unit + integration).

4. **Phase 4**  
   - Performance optimizations (code splitting, caching).  
   - Full production build & deployment pipeline.  
   - Polishing the UI/UX, accessibility checks, final brand styling.

---

## 10. Conclusion

This plan for **Next.js + shadcn** sets up:

- **Modern UI**: leveraging Tailwind-based components for quick, consistent design.  
- **Stable Data Layer**: React Query to manage communication with the FastAPI backend.  
- **Scalable Structure**: Clear folder organization, environment variables, and test patterns.  
- **Incremental Approach**: Phased development to gradually add features without overcomplicating the codebase.

By following these guidelines, your junior dev team can create a user-friendly, maintainable, and visually appealing frontend that integrates seamlessly with the Wealthsphere backend.