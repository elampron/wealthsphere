'use client';

import { useState, useEffect } from 'react';
import { NetWorthCard } from "@/components/feature/dashboard/NetWorthCard";
import { AccountSummaryCard } from "@/components/feature/dashboard/AccountSummaryCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "../../ui/card"; 
import { Button } from "@/components/ui/button";
import { investmentApi } from "@/api/investments";
import { assetApi } from "@/api/assets";
import { familyApi } from "@/api/family";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from 'next/navigation';
import type { InvestmentAccount } from "@/api/server-investments";

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

type DashboardClientProps = {
  initialInvestmentAccounts: InvestmentAccount[];
};

export function DashboardClient({ initialInvestmentAccounts }: DashboardClientProps) {
  // Transform server data to client format
  const initialAccounts = initialInvestmentAccounts.map((acc: any) => ({
    id: acc.id.toString(),
    name: acc.name,
    type: acc.account_type as 'RRSP' | 'TFSA' | 'Non-Registered',
    balance: acc.balance || 0,
  }));

  // State for holding the data
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [assets, setAssets] = useState<{ totalValue: number }>({ totalValue: 0 });
  const [liabilities, setLiabilities] = useState<{ totalValue: number }>({ totalValue: 0 });
  const [previousNetWorth, setPreviousNetWorth] = useState<number | undefined>(undefined);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(!initialInvestmentAccounts.length);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  // Fetch additional data from APIs
  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      // Start loading if we don't have accounts from server
      if (!initialInvestmentAccounts.length) {
        if (isMounted) setLoading(true);
        
        try {
          // Attempt to fetch accounts from client-side if we don't have them
          const accountsData = await investmentApi.getAll();
          if (isMounted) {
            const formattedAccounts = accountsData.map((acc: any) => ({
              id: acc.id.toString(),
              name: acc.name,
              type: acc.account_type as 'RRSP' | 'TFSA' | 'Non-Registered',
              balance: acc.balance || 0
            }));
            setAccounts(formattedAccounts);
          }
        } catch (err) {
          console.error("Failed to fetch investment accounts:", err);
          if (isMounted) {
            // Check if it's an authentication error
            if (err instanceof Error && 
                (err.message.includes('Authentication failed') || 
                 err.message.includes('session has expired'))) {
              toast({
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
        const assetsData = await assetApi.getAll();
        if (isMounted) {
          const totalAssets = assetsData.reduce((sum, asset) => sum + (asset.current_value || 0), 0);
          setAssets({ totalValue: totalAssets });
        }
        
        // For now, we don't have a liabilities API, so we'll use 0
        if (isMounted) {
          setLiabilities({ totalValue: 0 });
          
          // For now we don't have previous net worth data
          setPreviousNetWorth(undefined);
        }
        
        // Fetch family members
        const familyData = await familyApi.getAll();
        if (isMounted) {
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
            toast({
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
          toast({
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
  }, [initialInvestmentAccounts.length, toast, router]);
  
  // If the accounts array is empty, check if we should show a loading state or empty state
  const showNoAccountsMessage = !loading && accounts.length === 0;
  const showEmptyDataMessage = !loading && !error && 
    accounts.length === 0 && familyMembers.length === 0;
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Financial Dashboard</h1>
      
      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="mb-8">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="family">Family</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <NetWorthCard 
                totalAssets={assets.totalValue + accounts.reduce((sum, acc) => sum + acc.balance, 0)}
                totalLiabilities={liabilities.totalValue}
                previousNetWorth={previousNetWorth}
              />
              
              <AccountSummaryCard 
                accounts={accounts}
                title="Investment Accounts"
                description="Summary of all investment account balances"
              />
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
                    {accounts.map(account => (
                      <li key={account.id} className="py-3 flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{account.name}</h3>
                          <p className="text-sm text-muted-foreground">{account.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {new Intl.NumberFormat('en-CA', {
                              style: 'currency',
                              currency: 'CAD',
                              maximumFractionDigits: 0,
                            }).format(account.balance)}
                          </p>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="text-sm" 
                            onClick={() => window.location.href = '/accounts'}
                          >
                            View Details
                          </Button>
                        </div>
                      </li>
                    ))}
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
      )}
    </div>
  );
} 