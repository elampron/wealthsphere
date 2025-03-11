import { serverInvestmentApi } from '@/src/api/server-investments';
import AccountsClient from './AccountsClient';
import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Investment Accounts | WealthSphere',
  description: 'Manage your investment accounts and portfolios',
};

export default async function AccountsPage() {
  // Check if user is authenticated
  const cookieStore = cookies();
  const token = cookieStore.get('wealthsphere_access_token');
  
  // If not authenticated, redirect to login
  if (!token) {
    redirect('/login?callbackUrl=/accounts');
  }

  try {
    // Fetch investment accounts using server-side API
    const accountsData = await serverInvestmentApi.getAll();
    
    return (
      <div className="container mx-auto py-8">
        <AccountsClient initialAccounts={accountsData} />
      </div>
    );
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    
    // If there's an auth error, redirect to login
    if (error instanceof Error && error.message.includes('401')) {
      redirect('/login?callbackUrl=/accounts');
    }
    
    // For other errors, show a basic error message
    return (
      <div className="container mx-auto py-8">
        <div className="bg-destructive/10 border border-destructive rounded-md p-6 text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Accounts</h2>
          <p className="text-muted-foreground mb-4">
            There was a problem fetching your investment accounts.
          </p>
          <a href="/accounts" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            Try Again
          </a>
        </div>
      </div>
    );
  }
} 