'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Account = {
  id: string;
  name: string;
  type: 'RRSP' | 'TFSA' | 'Non-Registered';
  balance: number;
};

type AccountSummaryCardProps = {
  accounts: Account[];
  title: string;
  description?: string;
};

/**
 * Card that displays a summary of accounts by type
 */
export function AccountSummaryCard({
  accounts,
  title,
  description,
}: AccountSummaryCardProps) {
  // Group accounts by type
  const accountsByType = accounts.reduce<Record<string, { total: number; accounts: Account[] }>>(
    (acc, account) => {
      if (!acc[account.type]) {
        acc[account.type] = { total: 0, accounts: [] };
      }
      acc[account.type].total += account.balance;
      acc[account.type].accounts.push(account);
      return acc;
    },
    {}
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(accountsByType).map(([type, { total, accounts }]) => (
            <div key={type} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{type}</h4>
                <span className="font-bold">{formatCurrency(total)}</span>
              </div>
              <div className="space-y-1">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between text-sm text-muted-foreground"
                  >
                    <span>{account.name}</span>
                    <span>{formatCurrency(account.balance)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-4 pt-4 border-t flex items-center justify-between font-bold">
            <span>Total</span>
            <span>{formatCurrency(totalBalance)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ children, ...props }: CardFooterProps) {
  return <div className="flex items-center p-6 pt-0" {...props}>{children}</div>;
}