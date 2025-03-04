'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { expenseApi } from "@/lib/api/expenses";
import { ExpenseForm } from "@/components/forms/ExpenseForm";

// Interface for API response
interface Expense {
  id: number;
  name: string;
  amount: number;
  type: string;
  category: string;
  year: number;
  family_member_id: number | null;
  family_member_name?: string | null;
}

const expenseCategories = [
  "Housing", 
  "Transportation", 
  "Utilities", 
  "Food", 
  "Healthcare", 
  "Insurance",
  "Debt Payments",
  "Entertainment",
  "Education",
  "Clothing",
  "Personal Care",
  "Gifts/Donations",
  "Travel",
  "Other"
];

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  
  // Fetch expenses data
  useEffect(() => {
    async function fetchExpenses() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await expenseApi.getAll(undefined, undefined, currentYear);
        setExpenses(data);
      } catch (err) {
        console.error('Failed to fetch expenses:', err);
        setError('Failed to load expenses. Please try again later.');
        toast({
          title: "Error",
          description: "Failed to load expenses. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchExpenses();
  }, [toast, currentYear]);
  
  // Filter expenses based on active tab
  const filteredExpenses = activeTab === "all" 
    ? expenses 
    : expenses.filter(expense => expense.type === activeTab);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Calculate totals by type
  const calculateTotalByType = (type: string) => {
    return expenses
      .filter(expense => type === 'all' || expense.type === type)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };
  
  // Calculate totals by category
  const expensesByCategory = expenses.reduce<Record<string, number>>((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += expense.amount;
    return acc;
  }, {});

  const handleAddExpense = () => {
    setEditingExpense(null);
    setIsAddDialogOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsAddDialogOpen(true);
  };

  const handleExpenseFormSuccess = async () => {
    try {
      const data = await expenseApi.getAll(undefined, undefined, currentYear);
      setExpenses(data);
      toast({
        title: "Success",
        description: editingExpense ? "Expense updated successfully" : "Expense added successfully",
      });
    } catch (err) {
      console.error('Failed to refresh expenses:', err);
      toast({
        title: "Error",
        description: "Your change was saved, but we couldn't refresh the list. Please reload the page.",
        variant: "destructive",
      });
    }
  };
  
  // Render loading skeletons
  const renderSkeletons = () => (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <TableRow key={`skeleton-${i}`}>
          <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[50px] ml-auto" /></TableCell>
        </TableRow>
      ))}
    </>
  );
  
  // Render empty state
  const renderEmptyState = () => (
    <TableRow>
      <TableCell colSpan={6} className="h-24 text-center">
        <div className="flex flex-col items-center justify-center text-muted-foreground py-8">
          <p>No expenses found</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={handleAddExpense}
          >
            Add your first expense
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
  
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Expense Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage your household expenses</p>
        </div>
        <Button className="mt-4 md:mt-0" onClick={handleAddExpense}>
          Add New Expense
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Monthly Total</CardTitle>
            <CardDescription>All expenses this month</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-[100px]" />
            ) : (
              <div className="text-3xl font-bold">
                {formatCurrency(calculateTotalByType('all'))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Recurring</CardTitle>
            <CardDescription>Monthly fixed expenses</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-[100px]" />
            ) : (
              <div className="text-3xl font-bold">
                {formatCurrency(calculateTotalByType('Recurring'))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Discretionary</CardTitle>
            <CardDescription>Variable spending this month</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-[100px]" />
            ) : (
              <div className="text-3xl font-bold">
                {formatCurrency(calculateTotalByType('Discretionary'))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Expenses</TabsTrigger>
          <TabsTrigger value="Recurring">Recurring</TabsTrigger>
          <TabsTrigger value="Discretionary">Discretionary</TabsTrigger>
          <TabsTrigger value="Special">Special</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>Expense List</CardTitle>
              <CardDescription>
                {activeTab === 'all' 
                  ? 'All expenses' 
                  : `${activeTab} expenses only`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-center py-8 text-red-500">
                  <p>{error}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Year</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Family Member</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        renderSkeletons()
                      ) : filteredExpenses.length === 0 ? (
                        renderEmptyState()
                      ) : (
                        filteredExpenses.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell>{expense.year}</TableCell>
                            <TableCell>{expense.category}</TableCell>
                            <TableCell className="font-medium">{expense.name}</TableCell>
                            <TableCell>{expense.family_member_name || 'Shared'}</TableCell>
                            <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditExpense(expense)}
                              >
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Expense Breakdown</CardTitle>
          <CardDescription>By category</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={`skeleton-breakdown-${i}`} className="flex items-center">
                  <Skeleton className="h-4 w-[100px] mr-4" />
                  <Skeleton className="h-4 w-full flex-1" />
                  <Skeleton className="h-4 w-[80px] ml-2" />
                </div>
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No expense data available
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(expensesByCategory).map(([category, amount]) => (
                <div key={category} className="flex items-center">
                  <div className="w-1/3 font-medium">{category}</div>
                  <div className="w-2/3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-2 bg-primary rounded-full" 
                        style={{ 
                          width: `${(amount / calculateTotalByType('all')) * 100}%` 
                        }}
                      />
                      <span>{formatCurrency(amount)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Expense Form Dialog */}
      <ExpenseForm 
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={handleExpenseFormSuccess}
        initialData={editingExpense || undefined}
      />
    </div>
  );
} 