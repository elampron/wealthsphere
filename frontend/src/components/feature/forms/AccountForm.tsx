'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { InvestmentAccount, AccountType } from '@/types/finance';
import { FamilyMember } from '@/types/family';
import { accountsApi } from '@/api/accounts';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  familyMembers: FamilyMember[];
  isLoading?: boolean;
  account?: InvestmentAccount;
}

interface AccountFormValues {
  name: string;
  account_type: AccountType;
  institution?: string;
  expected_return_rate: number;
  is_taxable: boolean;
  contribution_room?: number;
  expected_conversion_year?: number;
  notes?: string;
  family_member_id: number;
}

export const AccountForm: React.FC<AccountFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  familyMembers,
  isLoading = false,
  account,
}) => {
  if (!familyMembers?.length) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cannot Add Account</DialogTitle>
            <DialogDescription>
              You need to add at least one family member before creating an account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const form = useForm<AccountFormValues>({
    defaultValues: {
      name: account?.name || '',
      account_type: account?.account_type || AccountType.TFSA,
      institution: account?.institution || '',
      expected_return_rate: account?.expected_return_rate || 0,
      is_taxable: account?.is_taxable || false,
      contribution_room: account?.contribution_room || 0,
      expected_conversion_year: account?.expected_conversion_year,
      notes: account?.notes || '',
      family_member_id: account?.family_member_id || familyMembers[0].id,
    },
    mode: 'onSubmit',
  });
  const { addToast } = useToast();

  const handleFormSubmit = async (data: AccountFormValues) => {
    try {
      const accountData = {
        account_name: data.name,
        account_type: data.account_type.toString(),
      };

      if (account) {
        await accountsApi.update(account.id.toString(), accountData);
        addToast({
          title: "Success",
          description: "Account updated successfully",
        });
      } else {
        await accountsApi.create(accountData);
        addToast({
          title: "Success",
          description: "Account created successfully",
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      addToast({
        title: "Error",
        description: err instanceof Error ? err.message : "Operation failed",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{account ? 'Edit Investment Account' : 'Add Investment Account'}</DialogTitle>
          <DialogDescription>
            {account 
              ? 'Update the details of this investment account.' 
              : 'Add a new investment account to track.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              rules={{ required: 'Name is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="name">Account Name</FormLabel>
                  <FormControl>
                    <Input id="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="account_type"
              rules={{ required: 'Account type is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="account_type">Account Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger id="account_type">
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(AccountType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="institution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="institution">Institution</FormLabel>
                  <FormControl>
                    <Input id="institution" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expected_return_rate"
              rules={{ required: 'Expected return rate is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="expected_return_rate">Expected Return Rate (%)</FormLabel>
                  <FormControl>
                    <Input 
                      id="expected_return_rate"
                      type="number" 
                      step={0.1} 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : '')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_taxable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel htmlFor="is_taxable">Taxable Account</FormLabel>
                    <FormDescription>
                      Whether this account is subject to taxation
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      id="is_taxable"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contribution_room"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="contribution_room">Contribution Room</FormLabel>
                  <FormControl>
                    <Input 
                      id="contribution_room"
                      type="number" 
                      min={0} 
                      {...field} 
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expected_conversion_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="expected_conversion_year">Expected Conversion Year</FormLabel>
                  <FormControl>
                    <Input 
                      id="expected_conversion_year"
                      type="number" 
                      min={new Date().getFullYear()} 
                      {...field} 
                      value={field.value || ''} 
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="notes">Notes</FormLabel>
                  <FormControl>
                    <Textarea id="notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="family_member_id"
              rules={{ required: 'Family member is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="family_member_id">Family Member</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger id="family_member_id">
                        <SelectValue placeholder="Select family member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {familyMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.first_name} {member.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : account ? 'Update Account' : 'Create Account'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AccountForm; 