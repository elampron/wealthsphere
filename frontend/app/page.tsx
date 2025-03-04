'use client';

import { useState, useEffect } from 'react';
import { NetWorthCard } from "@/components/dashboard/NetWorthCard";
import { AccountSummaryCard } from "@/components/dashboard/AccountSummaryCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card"; 
import { Button } from "@/components/ui/button";
import { investmentApi } from "@/lib/api/investments";
import { assetApi } from "@/lib/api/assets";
import { familyApi } from "@/lib/api/family";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

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

export default function DashboardPage() {
  // State for holding the data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [assets, setAssets] = useState<{ totalValue: number }>({ totalValue: 0 });
  const [liabilities, setLiabilities] = useState<{ totalValue: number }>({ totalValue: 0 });
  const [previousNetWorth, setPreviousNetWorth] = useState<number | undefined>(undefined);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Fetch data from APIs
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch accounts
        const accountsData = await investmentApi.getAll();
        const formattedAccounts = accountsData.map(acc => ({
          id: acc.id.toString(),
          name: acc.account_name,
          type: acc.account_type as 'RRSP' | 'TFSA' | 'Non-Registered',
          balance: acc.balance
        }));
        setAccounts(formattedAccounts);
        
        // Fetch assets
        const assetsData = await assetApi.getAll();
        const totalAssets = assetsData.reduce((sum, asset) => sum + asset.value, 0);
        setAssets({ totalValue: totalAssets });
        
        // For now, we don't have a liabilities API, so we'll use 0
        // This would be replaced with actual data when available
        setLiabilities({ totalValue: 0 });
        
        // For now we don't have previous net worth data
        // This would be replaced with actual data when available
        setPreviousNetWorth(undefined);
        
        // Fetch family members
        const familyData = await familyApi.getAll();
        const formattedFamily = familyData.map(member => ({
          id: member.id.toString(),
          name: member.name,
          relationship: member.relationship
        }));
        setFamilyMembers(formattedFamily);
        
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
        toast({
          title: "Error",
          description: "Could not load dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [toast]);
  
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
              
              {accounts.length === 0 ? (
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
