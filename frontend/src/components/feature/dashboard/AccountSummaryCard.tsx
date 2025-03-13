'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { InvestmentAccount, EntityValue } from '@/types/finance';

interface AccountSummaryCardProps {
  accounts: InvestmentAccount[];
  accountValues: EntityValue[];
  onEditAccount: (account: InvestmentAccount) => void;
}

export const AccountSummaryCard: React.FC<AccountSummaryCardProps> = ({
  accounts,
  accountValues,
  onEditAccount,
}) => {
  const getAccountValue = (accountId: number) => {
    const accountValue = accountValues.find(value => value.entity_id === accountId);
    return accountValue?.value || 0;
  };

  const totalValue = accountValues.reduce((sum, value) => sum + value.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investment Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {accounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <div>
                <p className="font-medium">{account.name}</p>
                <p className="text-sm text-muted-foreground">{account.account_type}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-semibold">{formatCurrency(getAccountValue(account.id))}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEditAccount(account)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Total Value</p>
              <p className="font-bold text-lg">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ children, ...props }: CardFooterProps) {
  return <div className="flex items-center p-6 pt-0" {...props}>{children}</div>;
}