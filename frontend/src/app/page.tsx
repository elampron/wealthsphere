// Server Component for initial data fetching
import { Suspense } from 'react';
import { DashboardClient } from '@/components/feature/dashboard/DashboardClient';
import { serverInvestmentApi } from '@/api/server-investments';

export default async function DashboardPage() {
  try {
    // Pre-fetch data on the server
    const investmentAccounts = await serverInvestmentApi.getAll();
    
    // Pass the fetched data to the client component
    return (
      <Suspense fallback={<div>Loading dashboard...</div>}>
        <DashboardClient initialInvestmentAccounts={investmentAccounts} />
      </Suspense>
    );
  } catch (error) {
    console.error('Error fetching server-side data:', error);
    
    // Fallback with empty data
    return (
      <Suspense fallback={<div>Loading dashboard...</div>}>
        <DashboardClient initialInvestmentAccounts={[]} />
      </Suspense>
    );
  }
}
