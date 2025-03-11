'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { familyApi, FamilyMember } from "@/src/api/family";
import { investmentApi } from "@/src/api/investments";
import { incomeApi } from "@/src/api/income";
import { insuranceApi } from "@/src/api/insurance";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { FamilyMemberForm } from "@/components/forms/FamilyMemberForm";

// Enhanced family member type with additional data
interface EnhancedFamilyMember extends FamilyMember {
  income: { source: string; annual: number }[];
  accounts: { id: string; type: string; balance: number }[];
  insurance: { type: string; coverage: number; premium: number; beneficiary: string }[];
}

export default function FamilyPage() {
  const [familyMembers, setFamilyMembers] = useState<EnhancedFamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all family members
      const members = await familyApi.getAll();
      
      // Enhance members with additional data
      const enhancedMembers = await Promise.all(
        members.map(async (member) => {
          // Initialize arrays to store real data
          let accounts: { id: string; type: string; balance: number }[] = [];
          let income: { source: string; annual: number }[] = [];
          let insurance: { type: string; coverage: number; premium: number; beneficiary: string }[] = [];
          
          // Fetch accounts for this family member
          try {
            const memberAccounts = await investmentApi.getAll(member.id);
            accounts = memberAccounts.map(account => ({
              id: account.id.toString(),
              type: account.account_type,
              balance: account.balance
            }));
          } catch (e) {
            console.error(`Failed to fetch accounts for member ${member.id}:`, e);
          }
          
          // Fetch income sources for this family member
          try {
            const memberIncome = await incomeApi.getAll(member.id);
            income = memberIncome.map(source => ({
              source: source.name,
              annual: source.amount
            }));
          } catch (e) {
            console.error(`Failed to fetch income for member ${member.id}:`, e);
          }
          
          // Fetch insurance policies for this family member
          try {
            const memberInsurance = await insuranceApi.getAll(member.id);
            insurance = memberInsurance.map(policy => ({
              type: policy.insurance_type,
              coverage: policy.coverage_amount,
              premium: policy.premium_amount,
              beneficiary: policy.provider || "Not specified"
            }));
          } catch (e) {
            console.error(`Failed to fetch insurance for member ${member.id}:`, e);
          }
          
          // Return enhanced member with real data
          return {
            ...member,
            income,
            accounts,
            insurance
          };
        })
      );
      
      setFamilyMembers(enhancedMembers);
    } catch (e) {
      console.error("Failed to fetch family data:", e);
      setError("Failed to load family data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  // Handle adding a new family member
  const handleAddFamilyMember = () => {
    setEditingMember(null);
    setIsAddFormOpen(true);
  };

  // Handle editing an existing family member
  const handleEditFamilyMember = (member: FamilyMember) => {
    console.log("Editing family member with data:", member);
    setEditingMember(member);
    setIsAddFormOpen(true);
  };

  // Handle form success (refresh data)
  const handleFormSuccess = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Family Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage financial profiles for your family members
            </p>
          </div>
          <Skeleton className="h-10 w-40 mt-4 md:mt-0" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Family Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage financial profiles for your family members
            </p>
          </div>
        </div>
        
        <Card className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Data</h2>
            <p className="mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Family Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage financial profiles for your family members
          </p>
        </div>
        <Button className="mt-4 md:mt-0" onClick={handleAddFamilyMember}>
          Add Family Member
        </Button>
      </div>

      {familyMembers.length === 0 ? (
        <Card className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">No Family Members</h2>
            <p className="mb-4">Add your first family member to get started.</p>
            <Button onClick={handleAddFamilyMember}>
              Add Family Member
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {familyMembers.map((member) => (
            <Card key={member.id} className="overflow-hidden">
              <CardHeader className="bg-primary/10">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{member.first_name} {member.last_name}</CardTitle>
                    <CardDescription>
                      {member.relationship_type} • {calculateAge(member.date_of_birth)} years old
                    </CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditFamilyMember(member)}
                  >
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
                      {member.accounts.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">No accounts found.</p>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="insurance">
                    <div className="space-y-2">
                      <h3 className="font-medium mb-2">Insurance Policies</h3>
                      {member.insurance.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">No insurance policies found.</p>
                      ) : (
                        member.insurance.map((policy, index) => (
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
                        ))
                      )}
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
      )}

      {/* Family Member Add/Edit Form */}
      <FamilyMemberForm
        isOpen={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        onSuccess={handleFormSuccess}
        initialData={editingMember || undefined}
      />
    </div>
  );
} 