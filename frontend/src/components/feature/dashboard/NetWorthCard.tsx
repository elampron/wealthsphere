'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format';
import { EntityValue } from '@/types/finance';

interface NetWorthCardProps {
  investmentValues: EntityValue[];
  assetValues: EntityValue[];
}

export const NetWorthCard: React.FC<NetWorthCardProps> = ({
  investmentValues,
  assetValues,
}) => {
  const totalInvestments = investmentValues.reduce((sum: number, value: EntityValue) => sum + value.value, 0);
  const totalAssets = assetValues.reduce((sum: number, value: EntityValue) => sum + value.value, 0);
  const netWorth = totalInvestments + totalAssets;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Worth Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Investments</p>
            <p className="text-lg font-semibold">{formatCurrency(totalInvestments)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Assets</p>
            <p className="text-lg font-semibold">{formatCurrency(totalAssets)}</p>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">Total Net Worth</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(netWorth)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 