'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { projectionsApi, ProjectionParameters, CashFlowProjection, WithdrawalStrategyResult } from "@/lib/api/projections";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function ProjectionsPage() {
  const [projectionParams, setProjectionParams] = useState<ProjectionParameters>({
    start_year: new Date().getFullYear(),
    end_year: new Date().getFullYear() + 30,
    inflation_rate: 0.02,
    province: 'ON'
  });
  
  const [netWorthData, setNetWorthData] = useState<Record<string, Record<string, number>> | null>(null);
  const [cashFlowData, setCashFlowData] = useState<Record<string, CashFlowProjection> | null>(null);
  const [withdrawalData, setWithdrawalData] = useState<Record<string, WithdrawalStrategyResult> | null>(null);
  
  const [activeTab, setActiveTab] = useState("net-worth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const fetchProjections = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all projections in parallel
      const [netWorth, cashFlow, withdrawals] = await Promise.all([
        projectionsApi.getNetWorthProjections(projectionParams),
        projectionsApi.getCashFlowProjections(projectionParams),
        projectionsApi.getDetailedWithdrawalProjections(projectionParams)
      ]);
      
      setNetWorthData(netWorth);
      setCashFlowData(cashFlow);
      setWithdrawalData(withdrawals);
    } catch (error) {
      console.error("Failed to fetch projections:", error);
      setError("Failed to load projections. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load projections. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch on initial load - user can explicitly refresh with the button
    fetchProjections();
  }, []);

  const handleInputChange = (name: keyof ProjectionParameters, value: number | string) => {
    setProjectionParams((prev) => ({
      ...prev,
      [name]: name === 'inflation_rate' && typeof value === 'number' ? value / 100 : value
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  };

  // Transform data for charts
  const prepareNetWorthChartData = () => {
    if (!netWorthData) return [];
    
    return Object.entries(netWorthData).map(([year, values]) => ({
      year,
      'Investments': values.investments || 0,
      'Real Estate': values.real_estate || 0,
      'Other Assets': values.other_assets || 0,
      'Total Net Worth': values.net_worth || 0
    }));
  };

  const prepareCashFlowChartData = () => {
    if (!cashFlowData) return [];
    
    return Object.entries(cashFlowData).map(([year, values]) => ({
      year,
      'Income': values.total_income,
      'Expenses': values.total_expenses,
      'Net Cash Flow': values.net_cash_flow
    }));
  };

  const prepareWithdrawalChartData = () => {
    if (!withdrawalData) return [];
    
    return Object.entries(withdrawalData).map(([year, values]) => {
      const accountWithdrawals: Record<string, number> = {};
      
      Object.entries(values.account_details).forEach(([account, details]) => {
        accountWithdrawals[account] = details.withdrawal;
      });
      
      return {
        year,
        'Shortfall': values.shortfall,
        'Unfunded': values.unfunded_amount,
        ...accountWithdrawals
      };
    });
  };

  // Prepare colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Financial Projections</h1>
          <p className="text-muted-foreground">
            View long-term financial projections including net worth, cash flow, and withdrawal strategies
          </p>
        </div>
        
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Projection Parameters</CardTitle>
            <CardDescription>
              Adjust the parameters to customize your financial projections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="start_year">Start Year</Label>
                <Input
                  id="start_year"
                  type="number"
                  min={new Date().getFullYear() - 5}
                  max={projectionParams.end_year - 1}
                  value={projectionParams.start_year}
                  onChange={(e) => handleInputChange('start_year', parseInt(e.target.value))}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="end_year">End Year</Label>
                <Input
                  id="end_year"
                  type="number"
                  min={projectionParams.start_year + 1}
                  max={new Date().getFullYear() + 80}
                  value={projectionParams.end_year}
                  onChange={(e) => handleInputChange('end_year', parseInt(e.target.value))}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="inflation_rate">Inflation Rate (%)</Label>
                <Input
                  id="inflation_rate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={projectionParams.inflation_rate ? (projectionParams.inflation_rate * 100) : 2}
                  onChange={(e) => handleInputChange('inflation_rate', parseFloat(e.target.value))}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="province">Province</Label>
                <Select
                  value={projectionParams.province || 'ON'}
                  onValueChange={(value) => handleInputChange('province', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AB">Alberta</SelectItem>
                    <SelectItem value="BC">British Columbia</SelectItem>
                    <SelectItem value="MB">Manitoba</SelectItem>
                    <SelectItem value="NB">New Brunswick</SelectItem>
                    <SelectItem value="NL">Newfoundland and Labrador</SelectItem>
                    <SelectItem value="NS">Nova Scotia</SelectItem>
                    <SelectItem value="ON">Ontario</SelectItem>
                    <SelectItem value="PE">Prince Edward Island</SelectItem>
                    <SelectItem value="QC">Quebec</SelectItem>
                    <SelectItem value="SK">Saskatchewan</SelectItem>
                    <SelectItem value="NT">Northwest Territories</SelectItem>
                    <SelectItem value="NU">Nunavut</SelectItem>
                    <SelectItem value="YT">Yukon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={fetchProjections} disabled={loading}>
              {loading ? "Loading..." : "Run Projections"}
            </Button>
          </CardFooter>
        </Card>
        
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-8 w-[250px]" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchProjections} variant="outline">
              Try Again
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="net-worth">Net Worth</TabsTrigger>
              <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawal Strategy</TabsTrigger>
            </TabsList>
            
            <TabsContent value="net-worth" className="space-y-6">
              {netWorthData ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Net Worth Projection</CardTitle>
                      <CardDescription>
                        Projected growth of your assets over time
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={prepareNetWorthChartData()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis tickFormatter={(value) => formatCurrency(value)} />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                          <Line type="monotone" dataKey="Total Net Worth" stroke="#8884d8" strokeWidth={2} />
                          <Line type="monotone" dataKey="Investments" stroke="#82ca9d" />
                          <Line type="monotone" dataKey="Real Estate" stroke="#ffc658" />
                          <Line type="monotone" dataKey="Other Assets" stroke="#ff7300" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Net Worth Breakdown</CardTitle>
                      <CardDescription>
                        Detailed view of your projected net worth by year
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Year</TableHead>
                              <TableHead>Investments</TableHead>
                              <TableHead>Real Estate</TableHead>
                              <TableHead>Other Assets</TableHead>
                              <TableHead>Total Net Worth</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(netWorthData).map(([year, values]) => (
                              <TableRow key={year}>
                                <TableCell>{year}</TableCell>
                                <TableCell>{formatCurrency(values.investments || 0)}</TableCell>
                                <TableCell>{formatCurrency(values.real_estate || 0)}</TableCell>
                                <TableCell>{formatCurrency(values.other_assets || 0)}</TableCell>
                                <TableCell className="font-medium">{formatCurrency(values.net_worth || 0)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No net worth projection data available. Run projections to view results.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="cash-flow" className="space-y-6">
              {cashFlowData ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Cash Flow Projection</CardTitle>
                      <CardDescription>
                        Projected income and expenses over time
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareCashFlowChartData()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis tickFormatter={(value) => formatCurrency(value)} />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                          <Bar dataKey="Income" fill="#82ca9d" />
                          <Bar dataKey="Expenses" fill="#ff7300" />
                          <Bar dataKey="Net Cash Flow" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Cash Flow Details</CardTitle>
                      <CardDescription>
                        Detailed view of your projected cash flow by year
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Year</TableHead>
                              <TableHead>Income</TableHead>
                              <TableHead>Expenses</TableHead>
                              <TableHead>Net Cash Flow</TableHead>
                              <TableHead>Shortfall</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(cashFlowData).map(([year, values]) => (
                              <TableRow key={year}>
                                <TableCell>{year}</TableCell>
                                <TableCell>{formatCurrency(values.total_income)}</TableCell>
                                <TableCell>{formatCurrency(values.total_expenses)}</TableCell>
                                <TableCell className={values.net_cash_flow >= 0 ? "text-green-600" : "text-red-600"}>
                                  {formatCurrency(values.net_cash_flow)}
                                </TableCell>
                                <TableCell>
                                  {values.withdrawal_strategy ? formatCurrency(values.withdrawal_strategy.shortfall) : 'N/A'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No cash flow projection data available. Run projections to view results.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="withdrawals" className="space-y-6">
              {withdrawalData ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Withdrawal Strategy</CardTitle>
                      <CardDescription>
                        Projected withdrawals from various accounts to meet expenses
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareWithdrawalChartData()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis tickFormatter={(value) => formatCurrency(value)} />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                          {Object.keys(withdrawalData[Object.keys(withdrawalData)[0]]?.account_details || {}).map((account, index) => (
                            <Bar 
                              key={account} 
                              dataKey={account} 
                              stackId="a" 
                              fill={COLORS[index % COLORS.length]} 
                            />
                          ))}
                          <Bar dataKey="Unfunded" stackId="a" fill="#ff0000" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Detailed Withdrawal Strategy</CardTitle>
                      <CardDescription>
                        Detailed view of account withdrawals by year
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Year</TableHead>
                              <TableHead>Shortfall</TableHead>
                              <TableHead>Unfunded Amount</TableHead>
                              <TableHead>Withdrawals</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(withdrawalData).map(([year, values]) => (
                              <TableRow key={year}>
                                <TableCell>{year}</TableCell>
                                <TableCell>{formatCurrency(values.shortfall)}</TableCell>
                                <TableCell>{formatCurrency(values.unfunded_amount)}</TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    {Object.entries(values.account_details).map(([account, details]) => (
                                      <div key={account} className="flex justify-between">
                                        <span>{account}:</span>
                                        <span>{formatCurrency(details.withdrawal)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No withdrawal strategy data available. Run projections to view results.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
} 