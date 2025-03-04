'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type NetWorthCardProps = {
  totalAssets: number;
  totalLiabilities: number;
  previousNetWorth?: number;
};

/**
 * Card that displays the net worth summary
 */
export function NetWorthCard({
  totalAssets,
  totalLiabilities,
  previousNetWorth,
}: NetWorthCardProps) {
  const netWorth = totalAssets - totalLiabilities;
  const formattedNetWorth = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(netWorth);

  const formattedAssets = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(totalAssets);

  const formattedLiabilities = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(totalLiabilities);

  // Calculate change percentage if we have a previous value
  let changePercentage: number | null = null;
  if (previousNetWorth !== undefined && previousNetWorth !== 0) {
    changePercentage = ((netWorth - previousNetWorth) / Math.abs(previousNetWorth)) * 100;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary/10">
        <CardTitle>Net Worth</CardTitle>
        <CardDescription>Summary of your financial position</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="text-3xl font-bold">{formattedNetWorth}</div>
        
        {changePercentage !== null && (
          <div className={`mt-1 text-sm ${changePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {changePercentage >= 0 ? '↑' : '↓'} {Math.abs(changePercentage).toFixed(1)}% from previous period
          </div>
        )}
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Assets</div>
            <div className="text-xl font-semibold">{formattedAssets}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Liabilities</div>
            <div className="text-xl font-semibold">{formattedLiabilities}</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/50 px-6 py-3">
        <div className="text-xs text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </CardFooter>
    </Card>
  );
} 