'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { investmentApi } from "@/lib/api/investments";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { AccountForm } from "@/components/forms/AccountForm";

// Define the interface to match our API data
interface AccountData {
  id: number;
  account_name: string;
  account_type: string;
  balance: number;
  annual_return_rate: number;
  family_member_id: number;
  created_at: string;
  updated_at: string;
}

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountData | null>(null);
  const { toast } = useToast();

  // Function to fetch accounts
  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await investmentApi.getAll();
      setAccounts(data);
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
      setError("Failed to load accounts. Please try again.");
      toast({
        title: "Error",
        description: "Could not load account data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch accounts from API
  useEffect(() => {
    fetchAccounts();
  }, [toast]);
  
  // Filter accounts based on active tab
  const filteredAccounts = activeTab === "all" 
    ? accounts 
    : accounts.filter(account => account.account_type === activeTab);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA');
  };

  const handleAddAccount = () => {
    setEditingAccount(null);
    setIsFormOpen(true);
  };

  const handleEditAccount = (account: AccountData) => {
    setEditingAccount(account);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    fetchAccounts();
  };
  
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Investment Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage your investment accounts and track performance</p>
        </div>
        <Button className="mt-4 md:mt-0" onClick={handleAddAccount}>
          Add New Account
        </Button>
      </div>
      
      {loading ? (
        <Card className="mb-8">
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-12 w-full mb-2" />
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>We encountered a problem loading your accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>
              <CardDescription>Overview of your investment accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="all">All Accounts</TabsTrigger>
                  <TabsTrigger value="RRSP">RRSP</TabsTrigger>
                  <TabsTrigger value="TFSA">TFSA</TabsTrigger>
                  <TabsTrigger value="Non-Registered">Non-Registered</TabsTrigger>
                </TabsList>
                
                <TabsContent value={activeTab}>
                  {filteredAccounts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No accounts found in this category.</p>
                      <Button variant="outline" className="mt-4" onClick={handleAddAccount}>
                        Add Your First Account
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Account Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                            <TableHead className="text-right">Return Rate</TableHead>
                            <TableHead className="text-right">Last Updated</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAccounts.map((account) => (
                            <TableRow key={account.id}>
                              <TableCell className="font-medium">{account.account_name}</TableCell>
                              <TableCell>{account.account_type}</TableCell>
                              <TableCell className="text-right">{formatCurrency(account.balance)}</TableCell>
                              <TableCell className="text-right">{account.annual_return_rate}%</TableCell>
                              <TableCell className="text-right">{formatDate(account.updated_at)}</TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditAccount(account)}
                                >
                                  Edit
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total RRSP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(
                    accounts
                      .filter(a => a.account_type === "RRSP")
                      .reduce((sum, a) => sum + a.balance, 0)
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Total TFSA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(
                    accounts
                      .filter(a => a.account_type === "TFSA")
                      .reduce((sum, a) => sum + a.balance, 0)
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Total Non-Registered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(
                    accounts
                      .filter(a => a.account_type === "Non-Registered")
                      .reduce((sum, a) => sum + a.balance, 0)
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Account Form */}
      <AccountForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        initialData={editingAccount || undefined}
      />
    </div>
  );
} 