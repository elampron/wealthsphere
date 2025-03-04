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

// Mock data (replace with actual API data later)
const mockAccounts = [
  { id: "1", name: "TD RRSP", type: "RRSP", balance: 150000, returnRate: 7.2, lastUpdated: "2023-12-15" },
  { id: "2", name: "Questrade RRSP", type: "RRSP", balance: 220000, returnRate: 8.1, lastUpdated: "2023-12-10" },
  { id: "3", name: "WealthSimple TFSA", type: "TFSA", balance: 85000, returnRate: 6.5, lastUpdated: "2023-12-12" },
  { id: "4", name: "RBC Non-Reg", type: "Non-Registered", balance: 45000, returnRate: 5.9, lastUpdated: "2023-12-14" },
];

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState("all");
  
  // Filter accounts based on active tab
  const filteredAccounts = activeTab === "all" 
    ? mockAccounts 
    : mockAccounts.filter(account => account.type === activeTab);
  
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
  
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Investment Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage your investment accounts and track performance</p>
        </div>
        <Button className="mt-4 md:mt-0">
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
              <TabsTrigger value="Non-Registered">Non-Registered</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab}>
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
                        <TableCell className="font-medium">{account.name}</TableCell>
                        <TableCell>{account.type}</TableCell>
                        <TableCell className="text-right">{formatCurrency(account.balance)}</TableCell>
                        <TableCell className="text-right">{account.returnRate}%</TableCell>
                        <TableCell className="text-right">{formatDate(account.lastUpdated)}</TableCell>
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
                mockAccounts
                  .filter(a => a.type === "RRSP")
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
                mockAccounts
                  .filter(a => a.type === "TFSA")
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
                mockAccounts
                  .filter(a => a.type === "Non-Registered")
                  .reduce((sum, a) => sum + a.balance, 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 