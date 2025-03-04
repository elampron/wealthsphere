'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data (replace with actual API data later)
const familyMembers = [
  {
    id: "1",
    name: "John Doe",
    relationship: "Self",
    birthDate: "1975-08-12",
    income: [
      { source: "Employment", annual: 120000 },
      { source: "Investment", annual: 15000 },
    ],
    accounts: [
      { id: "1", type: "RRSP", balance: 250000 },
      { id: "3", type: "TFSA", balance: 85000 },
    ],
    insurance: [
      { type: "Life", coverage: 500000, premium: 1200, beneficiary: "Jane Doe" },
    ],
  },
  {
    id: "2",
    name: "Jane Doe",
    relationship: "Spouse",
    birthDate: "1978-03-24",
    income: [
      { source: "Employment", annual: 95000 },
      { source: "Rental", annual: 24000 },
    ],
    accounts: [
      { id: "2", type: "RRSP", balance: 220000 },
      { id: "4", type: "Non-Registered", balance: 45000 },
    ],
    insurance: [
      { type: "Life", coverage: 400000, premium: 980, beneficiary: "John Doe" },
    ],
  },
];

export default function FamilyPage() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const calculateTotalIncome = (income: { source: string; annual: number }[]) => {
    return income.reduce((total, item) => total + item.annual, 0);
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Family Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage financial profiles for your family members
          </p>
        </div>
        <Button className="mt-4 md:mt-0">
          Add Family Member
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {familyMembers.map((member) => (
          <Card key={member.id} className="overflow-hidden">
            <CardHeader className="bg-primary/10">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{member.name}</CardTitle>
                  <CardDescription>
                    {member.relationship} • {calculateAge(member.birthDate)} years old
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="overview">
                <TabsList className="mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="income">Income</TabsTrigger>
                  <TabsTrigger value="accounts">Accounts</TabsTrigger>
                  <TabsTrigger value="insurance">Insurance</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Income</p>
                        <p className="text-lg font-semibold">{formatCurrency(calculateTotalIncome(member.income))}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Accounts</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(member.accounts.reduce((sum, account) => sum + account.balance, 0))}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Insurance Coverage</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(member.insurance.reduce((sum, policy) => sum + policy.coverage, 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="income">
                  <div className="space-y-2">
                    <h3 className="font-medium mb-2">Income Sources</h3>
                    {member.income.map((source, index) => (
                      <div key={index} className="flex justify-between py-2 border-b">
                        <span>{source.source}</span>
                        <span className="font-medium">{formatCurrency(source.annual)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 font-semibold">
                      <span>Total Annual Income</span>
                      <span>{formatCurrency(calculateTotalIncome(member.income))}</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="accounts">
                  <div className="space-y-2">
                    <h3 className="font-medium mb-2">Investment Accounts</h3>
                    {member.accounts.map((account) => (
                      <div key={account.id} className="flex justify-between py-2 border-b">
                        <span>{account.type}</span>
                        <span className="font-medium">{formatCurrency(account.balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 font-semibold">
                      <span>Total</span>
                      <span>
                        {formatCurrency(member.accounts.reduce((sum, account) => sum + account.balance, 0))}
                      </span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="insurance">
                  <div className="space-y-2">
                    <h3 className="font-medium mb-2">Insurance Policies</h3>
                    {member.insurance.map((policy, index) => (
                      <div key={index} className="border rounded-md p-3 mb-3">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{policy.type} Insurance</span>
                          <span className="font-medium">{formatCurrency(policy.coverage)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>Annual Premium: {formatCurrency(policy.premium)}</div>
                          <div>Beneficiary: {policy.beneficiary}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="bg-muted/30 flex justify-between">
              <span className="text-sm text-muted-foreground">
                ID: {member.id}
              </span>
              <Button variant="outline" size="sm">
                View Projections
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 