'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Switch,
  FormControlLabel,
  Box,
  Button,
} from '@mui/material';
import { InvestmentAccount } from '@/types/finance';
import { FamilyMember } from '@/types/family';
import { accountsApi } from '@/api/accounts';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  familyMembers: FamilyMember[];
  isLoading?: boolean;
  account?: InvestmentAccount;
}

export const AccountForm: React.FC<AccountFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  familyMembers,
  isLoading = false,
  account,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: account?.name || '',
      account_type: account?.account_type || '',
      institution: account?.institution || '',
      initial_value: account?.initial_value || 0,
      expected_return_rate: account?.expected_return_rate || 0,
      is_taxable: account?.is_taxable || false,
      contribution_room: account?.contribution_room || 0,
      expected_conversion_year: account?.expected_conversion_year || undefined,
      notes: account?.notes || '',
      family_member_id: account?.family_member_id || familyMembers[0]?.id,
    },
  });
  const { addToast } = useToast();

  const handleFormSubmit = async (data: any) => {
    try {
      if (account) {
        await accountsApi.update(account.id, data);
        addToast({
          title: "Success",
          description: "Account updated successfully",
        });
      } else {
        await accountsApi.create(data);
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
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Name is required' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Account Name"
                error={!!errors.name}
                helperText={errors.name?.message}
                fullWidth
              />
            )}
          />

          <Controller
            name="account_type"
            control={control}
            rules={{ required: 'Account type is required' }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.account_type}>
                <InputLabel>Account Type</InputLabel>
                <Select {...field} label="Account Type">
                  <MenuItem value="TFSA">TFSA</MenuItem>
                  <MenuItem value="RRSP">RRSP</MenuItem>
                  <MenuItem value="RESP">RESP</MenuItem>
                  <MenuItem value="Non-Registered">Non-Registered</MenuItem>
                  <MenuItem value="Pension">Pension</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
                {errors.account_type && (
                  <FormHelperText>{errors.account_type.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />

          <Controller
            name="institution"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Institution"
                error={!!errors.institution}
                helperText={errors.institution?.message}
                fullWidth
              />
            )}
          />

          <Controller
            name="initial_value"
            control={control}
            rules={{ min: { value: 0, message: 'Value must be positive' } }}
            render={({ field }) => (
              <TextField
                {...field}
                type="number"
                label="Initial Value"
                error={!!errors.initial_value}
                helperText={errors.initial_value?.message}
                fullWidth
                InputProps={{ inputProps: { min: 0 } }}
              />
            )}
          />

          <Controller
            name="expected_return_rate"
            control={control}
            rules={{ required: 'Expected return rate is required' }}
            render={({ field }) => (
              <TextField
                {...field}
                type="number"
                label="Expected Return Rate (%)"
                error={!!errors.expected_return_rate}
                helperText={errors.expected_return_rate?.message}
                fullWidth
                InputProps={{ inputProps: { step: 0.1 } }}
              />
            )}
          />

          <Controller
            name="is_taxable"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch {...field} checked={field.value} />}
                label="Is Taxable"
              />
            )}
          />

          <Controller
            name="contribution_room"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="number"
                label="Contribution Room"
                error={!!errors.contribution_room}
                helperText={errors.contribution_room?.message}
                fullWidth
                InputProps={{ inputProps: { min: 0 } }}
              />
            )}
          />

          <Controller
            name="expected_conversion_year"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="number"
                label="Expected Conversion Year"
                error={!!errors.expected_conversion_year}
                helperText={errors.expected_conversion_year?.message}
                fullWidth
                InputProps={{ inputProps: { min: new Date().getFullYear() } }}
              />
            )}
          />

          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Notes"
                multiline
                rows={4}
                error={!!errors.notes}
                helperText={errors.notes?.message}
                fullWidth
              />
            )}
          />

          <Controller
            name="family_member_id"
            control={control}
            rules={{ required: 'Family member is required' }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.family_member_id}>
                <InputLabel>Owner</InputLabel>
                <Select {...field} label="Owner">
                  {familyMembers.map((member) => (
                    <MenuItem key={member.id} value={member.id}>
                      {member.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.family_member_id && (
                  <FormHelperText>{errors.family_member_id.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading}
              sx={{ mt: 2 }}
            >
              {account ? 'Update Account' : 'Create Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AccountForm; 