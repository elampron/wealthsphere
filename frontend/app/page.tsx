'use client';

import { NetWorthCard } from "@/components/dashboard/NetWorthCard";
import { AccountSummaryCard } from "@/components/dashboard/AccountSummaryCard";
import { useAccounts } from "@/hooks/useAccounts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for now until we connect to backend
const mockNetWorth = {
  totalAssets: 750000,
  totalLiabilities: 320000,
  previousNetWorth: 400000,
};

const mockAccounts = [
  { id: "1", name: "TD RRSP", type: "RRSP" as const, balance: 150000 },
  { id: "2", name: "Questrade RRSP", type: "RRSP" as const, balance: 220000 },
  { id: "3", name: "WealthSimple TFSA", type: "TFSA" as const, balance: 85000 },
  { id: "4", name: "RBC Non-Reg", type: "Non-Registered" as const, balance: 45000 },
];

// Mock family members
const familyMembers = [
  { id: "1", name: "John Doe", relationship: "Self" },
  { id: "2", name: "Jane Doe", relationship: "Spouse" },
];

export default function DashboardPage() {
  // We'll use real data from the API when it's ready
  // const { data: accounts = [], isLoading } = useAccounts();
  
  // Using mock data for now
  const accounts = mockAccounts;
  const isLoading = false;
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Financial Dashboard</h1>
      
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="family">Family</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <NetWorthCard 
              totalAssets={mockNetWorth.totalAssets}
              totalLiabilities={mockNetWorth.totalLiabilities}
              previousNetWorth={mockNetWorth.previousNetWorth}
            />
            
            <AccountSummaryCard 
              accounts={accounts}
              title="Investment Accounts"
              description="Summary of all investment account balances"
            />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Additional summary cards will go here */}
          </div>
        </TabsContent>
        
        <TabsContent value="accounts">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Accounts</h2>
            <p className="text-muted-foreground">
              Manage your investment accounts and track their performance.
            </p>
            
            {/* Account details will go here */}
            <div className="border rounded-lg p-4 bg-card">
              <p>Account management interface will be implemented here.</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="family">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Family Members</h2>
            <p className="text-muted-foreground">
              Manage financial profiles for your family members.
            </p>
            
            <div className="border rounded-lg divide-y">
              {familyMembers.map(member => (
                <div key={member.id} className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.relationship}</p>
                  </div>
                  <button className="text-sm underline text-primary">View Details</button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
