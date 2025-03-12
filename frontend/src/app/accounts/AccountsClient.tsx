'use client';

import { useState } from 'react';
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
import { InvestmentAccount } from "@/api/server-investments";
import { useToast } from "@/components/ui/use-toast";
import { AccountForm } from "@/components/feature/forms/AccountForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { investmentApi } from "@/api/investments";
import { useRouter } from "next/navigation";

// Interface for client-side account format
interface ClientInvestmentAccount extends InvestmentAccount {
  balance: number;
}

// Interface for server response format
interface ServerInvestmentAccount {
  id: number;
  name: string;
  account_type: string;
  current_balance: number;
  institution?: string;
  family_member_id: number;
  updated_at?: string;
}

interface AccountsClientProps {
  initialAccounts: InvestmentAccount[];
}

export default function AccountsClient({ initialAccounts }: AccountsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [accounts, setAccounts] = useState<InvestmentAccount[]>(initialAccounts);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<InvestmentAccount | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

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
  
  const formatDate = (dateString?: string) => {
    return dateString ? new Date(dateString).toLocaleDateString('en-CA') : 'N/A';
  };

  const handleAddAccount = () => {
    setEditingAccount(null);
    setIsFormOpen(true);
  };

  const handleEditAccount = (account: InvestmentAccount) => {
    const formattedAccount = {
      id: account.id,
      account_name: account.name,
      account_type: account.account_type,
      balance: account.balance,
      family_member_id: account.family_member_id
    };
    setEditingAccount(formattedAccount);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (account: InvestmentAccount) => {
    setAccountToDelete(account);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;
    
    try {
      await investmentApi.delete(accountToDelete.id);
      toast({
        title: "Account deleted",
        description: `${accountToDelete.name} has been deleted successfully.`,
      });
      // Remove the account from the local state
      setAccounts(accounts.filter(a => a.id !== accountToDelete.id));
    } catch (err) {
      console.error("Failed to delete account:", err);
      
      // Check if the error is due to authentication
      if (err instanceof Error && err.message.includes('401')) {
        toast({
          title: "Session expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        // Redirect will happen via the API error handler
      } else {
        toast({
          title: "Error",
          description: "Could not delete account. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsDeleteDialogOpen(false);
      setAccountToDelete(null);
    }
  };

  const handleFormSuccess = (updatedAccount: InvestmentAccount) => {
    // If editing an existing account, update it in the array
    if (editingAccount) {
      setAccounts(accounts.map(a => a.id === updatedAccount.id ? updatedAccount : a));
    } else {
      // Otherwise add the new account to the array
      setAccounts([...accounts, updatedAccount]);
    }
    setIsFormOpen(false);
    
    // Refresh the page to get the latest data from the server
    router.refresh();
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Investment Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage your investment accounts and track performance</p>
        </div>
        <Button className="mt-4 md:mt-0" onClick={handleAddAccount}>
          Add New Account
        </Button>
      </div>
      
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
              <TabsTrigger value="MARGIN">Non-Registered</TabsTrigger>
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
                        <TableHead>Institution</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAccounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">{account.name}</TableCell>
                          <TableCell>{account.account_type}</TableCell>
                          <TableCell>{account.institution}</TableCell>
                          <TableCell className="text-right">{formatCurrency(account.balance)}</TableCell>
                          <TableCell className="text-right">{formatDate(account.updated_at)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditAccount(account)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteClick(account)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
                  .filter(a => a.account_type === "MARGIN")
                  .reduce((sum, a) => sum + a.balance, 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Form */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => !open && setIsFormOpen(false)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Edit Account' : 'Add Investment Account'}</DialogTitle>
            <DialogDescription>
              {editingAccount 
                ? 'Update the details of your investment account.' 
                : 'Add a new investment account to track your investments.'}
            </DialogDescription>
          </DialogHeader>
          
          <AccountForm 
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            initialData={editingAccount}
            onSuccess={(account: ServerInvestmentAccount) => {
              if (!account) {
                console.error("Account data is undefined in onSuccess handler");
                return;
              }
              
              // Convert server account format to client format
              const clientAccount: Partial<InvestmentAccount> = {
                id: String(account.id), // Convert to string to match InvestmentAccount interface
                name: account.name,
                account_type: account.account_type,
                institution: account.institution || '',
                balance: account.current_balance || 0,
                family_member_id: String(account.family_member_id), // Convert to string to match interface
                updated_at: account.updated_at
              };
              
              handleFormSuccess(clientAccount as InvestmentAccount);
            }}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete the account "{accountToDelete?.name}". 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteConfirm}
              variant="destructive"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}