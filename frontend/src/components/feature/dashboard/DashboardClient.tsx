'use client';

import { useState, useEffect } from 'react';
import { NetWorthCard } from "@/components/feature/dashboard/NetWorthCard";
import { AccountSummaryCard } from "@/components/feature/dashboard/AccountSummaryCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card"; 
import { Button } from "@/components/ui/button";
import { investmentsApi } from "@/api/investments";
import { assetsApi } from "@/api/assets";
import { familyApi } from "@/api/family";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from 'next/navigation';
import { InvestmentAccount, Asset, EntityValue, AccountType } from "@/types/finance";
import { formatCurrency } from '@/utils/format';

// Account type (transformed from API response)
type Account = {
  id: string;
  name: string;
  type: 'RRSP' | 'TFSA' | 'Non-Registered';
  balance: number;
};

// Family member type (transformed from API response)
type FamilyMember = {
  id: string;
  name: string;
  relationship: string;
};

interface DashboardClientProps {
  initialInvestmentAccounts: InvestmentAccount[];
}

export function DashboardClient({ initialInvestmentAccounts }: DashboardClientProps) {
  const [accounts, setAccounts] = useState<InvestmentAccount[]>(initialInvestmentAccounts);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [investmentValues, setInvestmentValues] = useState<EntityValue[]>([]);
  const [assetValues, setAssetValues] = useState<EntityValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      if (!initialInvestmentAccounts.length) {
        if (isMounted) setLoading(true);
        
        try {
          const accountsData = await investmentsApi.getAccounts();
          if (isMounted && Array.isArray(accountsData)) {
            // Transform the account data to match our InvestmentAccount type
            const formattedAccounts = accountsData.map(acc => ({
              id: acc.id,
              user_id: acc.user_id,
              family_member_id: acc.family_member_id,
              name: acc.name,
              account_type: acc.account_type as AccountType,
              institution: acc.institution,
              expected_return_rate: acc.expected_return_rate || 0,
              is_taxable: acc.is_taxable || false,
              contribution_room: acc.contribution_room,
              expected_conversion_year: acc.expected_conversion_year,
              notes: acc.notes,
              current_value: acc.current_value || 0
            })) as InvestmentAccount[];
            setAccounts(formattedAccounts);
            // Convert account balances to EntityValue format
            const values = formattedAccounts.map(acc => ({
              id: acc.id,
              entity_type: 'investment_account',
              entity_id: acc.id,
              scenario_id: 1, // Default scenario
              value: acc.current_value || 0,
              recorded_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            })) as EntityValue[];
            setInvestmentValues(values);
          }
        } catch (err) {
          console.error("Failed to fetch investment accounts:", err);
          if (isMounted) {
            setError("Failed to load investment accounts");
          }
        }
      } else {
        // Convert initial accounts to EntityValue format
        const values = initialInvestmentAccounts.map(acc => ({
          id: acc.id,
          entity_type: 'investment_account',
          entity_id: acc.id,
          scenario_id: 1, // Default scenario
          value: acc.current_value || 0,
          recorded_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })) as EntityValue[];
        setInvestmentValues(values);
      }
      
      try {
        const assetsData = await assetsApi.getAssets();
        if (isMounted && Array.isArray(assetsData)) {
          setAssets(assetsData);
          // Convert asset values to EntityValue format
          const values = assetsData.map(asset => ({
            id: asset.id,
            entity_type: 'asset',
            entity_id: asset.id,
            scenario_id: 1, // Default scenario
            value: asset.current_value || 0,
            recorded_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          })) as EntityValue[];
          setAssetValues(values);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        if (isMounted) {
          setError("Failed to load dashboard data");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();
    return () => { isMounted = false; };
  }, [initialInvestmentAccounts]);

  const handleEditAccount = (account: InvestmentAccount) => {
    router.push(`/investments/accounts/${account.id}`);
  };

  const calculateTotalAssets = () => {
    return (assets || []).reduce((sum: number, asset: Asset) => sum + (asset.current_value || 0), 0);
  };

  // State for holding the data
  const [liabilities, setLiabilities] = useState<{ totalValue: number }>({ totalValue: 0 });
  const [previousNetWorth, setPreviousNetWorth] = useState<number | undefined>(undefined);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  
  // Fetch additional data from APIs
  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      // Start loading if we don't have accounts from server
      if (!initialInvestmentAccounts.length) {
        if (isMounted) setLoading(true);
        
        try {
          // Attempt to fetch accounts from client-side if we don't have them
          const accountsData = await investmentsApi.getAccounts();
          if (isMounted && Array.isArray(accountsData)) {
            const formattedAccounts = accountsData.map(acc => ({
              id: acc.id,
              user_id: acc.user_id,
              family_member_id: acc.family_member_id,
              name: acc.name,
              account_type: acc.account_type as AccountType,
              institution: acc.institution,
              expected_return_rate: acc.expected_return_rate || 0,
              is_taxable: acc.is_taxable || false,
              contribution_room: acc.contribution_room,
              expected_conversion_year: acc.expected_conversion_year,
              notes: acc.notes,
              current_value: acc.current_value || 0
            })) as InvestmentAccount[];
            setAccounts(formattedAccounts);
          }
        } catch (err) {
          console.error("Failed to fetch investment accounts:", err);
          if (isMounted) {
            // Check if it's an authentication error
            if (err instanceof Error && 
                (err.message.includes('Authentication failed') || 
                 err.message.includes('session has expired'))) {
              addToast({
                title: "Authentication Error",
                description: "Please log in to view your dashboard.",
                variant: "destructive"
              });
              
              // Redirect to login page
              const callbackUrl = encodeURIComponent(window.location.pathname);
              router.push(`/login?callbackUrl=${callbackUrl}`);
              return; // Stop further API calls
            }
          }
          // We'll continue and try to fetch other data
        }
      }
      
      try {
        // Fetch assets
        const assetsData = await assetsApi.getAssets();
        if (isMounted && Array.isArray(assetsData)) {
          const totalAssets = assetsData.reduce((sum, asset) => sum + (asset.current_value || 0), 0);
          setAssets(assetsData);
        }
        
        // For now, we don't have a liabilities API, so we'll use 0
        if (isMounted) {
          setLiabilities({ totalValue: 0 });
          setPreviousNetWorth(undefined);
        }
        
        // Fetch family members
        const familyData = await familyApi.getAll();
        if (isMounted && Array.isArray(familyData)) {
          const formattedFamily = familyData.map(member => ({
            id: member.id.toString(),
            name: `${member.first_name} ${member.last_name}`,
            relationship: member.relationship_type
          }));
          setFamilyMembers(formattedFamily);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        if (isMounted) {
          // Check if it's an authentication error
          if (err instanceof Error && 
              (err.message.includes('Authentication failed') || 
               err.message.includes('session has expired'))) {
            addToast({
              title: "Authentication Error",
              description: "Please log in to view your dashboard.",
              variant: "destructive"
            });
            
            // Redirect to login page
            const callbackUrl = encodeURIComponent(window.location.pathname);
            router.push(`/login?callbackUrl=${callbackUrl}`);
            return; // Stop further processing
          }
          
          setError("Failed to load dashboard data. Please try again later.");
          addToast({
            title: "Error",
            description: "Failed to load dashboard data. Please try again later.",
            variant: "destructive"
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    fetchData();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [initialInvestmentAccounts.length, addToast, router]);
  
  // If the accounts array is empty, check if we should show a loading state or empty state
  const showNoAccountsMessage = !loading && accounts.length === 0;
  const showEmptyDataMessage = !loading && !error && 
    accounts.length === 0 && familyMembers.length === 0;
  
  if (loading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Financial Dashboard</h1>
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Financial Dashboard</h1>
        <Card>
          <div className="py-8">
            <div className="text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!accounts.length && !assets.length) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Financial Dashboard</h1>
        <Card>
          <div className="py-8">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">You don't have any investment accounts yet.</p>
              <Button onClick={() => router.push('/investments/new')}>Add Investment Account</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const renderAccountType = (type: AccountType) => {
    switch (type) {
      case AccountType.RRSP:
        return 'RRSP';
      case AccountType.TFSA:
        return 'TFSA';
      case AccountType.NON_REGISTERED:
        return 'Non-Registered';
      default:
        return type;
    }
  };

  const renderAccountCard = (account: InvestmentAccount) => {
    const value = investmentValues.find(v => v.entity_id === account.id)?.value || 0;
    return (
      <div key={account.id} className="flex items-center justify-between p-4 rounded-lg border">
        <div>
          <h3 className="font-medium">{account.name}</h3>
          <p className="text-sm text-muted-foreground">{renderAccountType(account.account_type)}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">{formatCurrency(value)}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Financial Dashboard</h1>
      
      <Tabs defaultValue="overview" className="flex flex-col gap-2 mb-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="family">Family</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <NetWorthCard 
              investmentValues={investmentValues}
              assetValues={assetValues}
            />
            
            <Card>
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="text-lg font-semibold leading-none tracking-tight">Investment Accounts</h3>
              </div>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-accent"
                    >
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <p className="text-sm text-muted-foreground">{account.account_type}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-semibold">{formatCurrency(account.current_value || 0)}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditAccount(account)}
                          aria-label="edit"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-pencil h-4 w-4"
                          >
                            <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                            <path d="m15 5 4 4" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">Total Value</p>
                      <p className="font-bold text-lg">
                        {formatCurrency(investmentValues.reduce((sum, value) => sum + value.value, 0))}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Additional summary cards would go here */}
          </div>
        </TabsContent>
        
        <TabsContent value="accounts">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Accounts</h2>
            <p className="text-muted-foreground">
              Manage your investment accounts and track their performance.
            </p>
            
            {showNoAccountsMessage ? (
              <div className="border rounded-lg p-8 bg-card text-center">
                <p className="mb-4">You don't have any investment accounts yet.</p>
                <Button variant="outline" onClick={() => window.location.href = '/accounts'}>
                  Add Your First Account
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-card">
                <ul className="divide-y">
                  {accounts.map(account => renderAccountCard(account))}
                </ul>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="family">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Family Members</h2>
            <p className="text-muted-foreground">
              Manage financial profiles for your family members.
            </p>
            
            {familyMembers.length === 0 ? (
              <div className="border rounded-lg p-8 bg-card text-center">
                <p className="mb-4">You haven't added any family members yet.</p>
                <Button variant="outline" onClick={() => window.location.href = '/family'}>
                  Add Family Members
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg divide-y">
                {familyMembers.map(member => (
                  <div key={member.id} className="p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">{member.relationship}</p>
                    </div>
                    <Button 
                      variant="link" 
                      onClick={() => window.location.href = '/family'}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 