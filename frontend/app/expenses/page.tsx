'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data (replace with actual API data later)
const mockExpenses = [
  { 
    id: "1", 
    category: "Housing", 
    description: "Mortgage Payment", 
    amount: 2500, 
    date: "2023-12-01", 
    type: "Recurring",
    familyMember: "Shared"
  },
  { 
    id: "2", 
    category: "Transportation", 
    description: "Car Lease", 
    amount: 450, 
    date: "2023-12-05", 
    type: "Recurring",
    familyMember: "John Doe"
  },
  { 
    id: "3", 
    category: "Utilities", 
    description: "Electricity Bill", 
    amount: 180, 
    date: "2023-12-10", 
    type: "Recurring",
    familyMember: "Shared"
  },
  { 
    id: "4", 
    category: "Discretionary", 
    description: "Dining Out", 
    amount: 125, 
    date: "2023-12-15", 
    type: "Discretionary",
    familyMember: "Jane Doe"
  },
  { 
    id: "5", 
    category: "Special", 
    description: "Home Renovation", 
    amount: 5000, 
    date: "2023-12-20", 
    type: "Special",
    familyMember: "Shared"
  },
];

const expenseCategories = [
  "Housing", 
  "Transportation", 
  "Utilities", 
  "Food", 
  "Healthcare", 
  "Insurance",
  "Debt Payments",
  "Discretionary",
  "Special",
  "Other"
];

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState("all");
  
  // Filter expenses based on active tab
  const filteredExpenses = activeTab === "all" 
    ? mockExpenses 
    : mockExpenses.filter(expense => expense.type === activeTab);
  
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
  
  // Calculate totals by type
  const calculateTotalByType = (type: string) => {
    return mockExpenses
      .filter(expense => type === 'all' || expense.type === type)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };
  
  // Calculate totals by category
  const expensesByCategory = mockExpenses.reduce<Record<string, number>>((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += expense.amount;
    return acc;
  }, {});
  
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Expense Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage your household expenses</p>
        </div>
        <Button className="mt-4 md:mt-0">
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
            <div className="text-3xl font-bold">
              {formatCurrency(calculateTotalByType('all'))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Recurring</CardTitle>
            <CardDescription>Monthly fixed expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(calculateTotalByType('Recurring'))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Discretionary</CardTitle>
            <CardDescription>Variable spending this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(calculateTotalByType('Discretionary'))}
            </div>
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
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Family Member</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{formatDate(expense.date)}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell>{expense.familyMember}</TableCell>
                        <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
        </CardContent>
      </Card>
    </div>
  );
} 